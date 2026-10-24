import type { Database } from 'better-sqlite3';

import { IndexingError } from '../shared/errors.js';

import type { Audit, AuditEmbeddingInput, AuditEmbeddingStore } from './types.js';

/** Issue d'une indexation complète. */
export interface IndexationOutcome {
  /** Lignes écrites dans l'index plein texte pour l'audit. */
  ftsRows: number;
  /** `true` si un magasin d'embeddings était injecté et a été sollicité. */
  vectorized: boolean;
}

/**
 * Indexeur d'audits (Sprint 10-2).
 *
 * Deux chemins d'indexation complémentaires :
 * - **FTS5** (`audit_fts`, table autonome) : index interne à la base, écrit
 *   par `INSERT`/`DELETE` directs — une ligne par constat, `rowid` = identifiant
 *   du constat, avec l'URL et le titre de l'audit pour la recherche ;
 * - **Embeddings** : délégués au magasin {@link AuditEmbeddingStore} injecté
 *   (contrat de `types.ts`). Sans magasin, l'indexation reste plein texte —
 *   l'issue `vectorized: false` le signale, jamais de vecteur simulé.
 */
export class AuditIndexer {
  /**
   * @param db - Connexion ouverte sur le schéma d'audits.
   * @param embeddings - Magasin d'embeddings optionnel (fournisseur injecté).
   */
  constructor(
    private readonly db: Database,
    private readonly embeddings?: AuditEmbeddingStore,
  ) {}

  /**
   * Reconstruit intégralement l'index plein texte depuis `audit_findings`.
   *
   * @returns Nombre de lignes indexées.
   * @throws {IndexingError} Échec SQL de la reconstruction.
   */
  rebuildFTSIndex(): number {
    try {
      this.db.exec('DELETE FROM audit_fts');

      const result = this.db
        .prepare(
          `INSERT INTO audit_fts (rowid, url, title, description)
           SELECT f.id, m.url, f.title, COALESCE(f.description, '')
             FROM audit_findings f
             JOIN audit_metadata m ON m.id = f.audit_id`,
        )
        .run();

      return result.changes;
    } catch (error) {
      throw new IndexingError('reconstruction de audit_fts', { cause: error });
    }
  }

  /**
   * Indexe (ou réindexe) les constats d'un seul audit dans `audit_fts`.
   *
   * @param auditId - Identifiant de l'audit.
   * @returns Nombre de lignes indexées.
   * @throws {IndexingError} Échec SQL.
   */
  indexAuditFTS(auditId: number): number {
    try {
      this.db
        .prepare(
          `DELETE FROM audit_fts
            WHERE rowid IN (SELECT id FROM audit_findings WHERE audit_id = ?)`,
        )
        .run(auditId);

      const inserted = this.db
        .prepare(
          `INSERT INTO audit_fts (rowid, url, title, description)
           SELECT f.id, m.url, f.title, COALESCE(f.description, '')
             FROM audit_findings f
             JOIN audit_metadata m ON m.id = f.audit_id
            WHERE f.audit_id = ?`,
        )
        .run(auditId);

      return inserted.changes;
    } catch (error) {
      throw new IndexingError(`indexation FTS de l'audit ${String(auditId)}`, {
        cause: error,
      });
    }
  }

  /**
   * Produit et enregistre les embeddings des constats d'un audit.
   *
   * @param audit - Audit persisté (identifiants de constats requis).
   * @returns `true` si les embeddings ont été produits, `false` si aucun
   *   magasin n'est injecté (indexation plein texte uniquement).
   * @throws {IndexingError} Audit non persisté ou échec du magasin.
   */
  async addEmbeddings(audit: Audit): Promise<boolean> {
    if (this.embeddings === undefined) {
      return false;
    }

    const auditId = audit.metadata.id;
    if (auditId === undefined) {
      throw new IndexingError("impossible d'indexer un audit non persisté (id absent)");
    }

    const items: AuditEmbeddingInput[] = audit.findings.map((finding) => {
      if (finding.id === undefined) {
        throw new IndexingError("impossible d'indexer un constat non persisté (id absent)");
      }

      return {
        id: `audit-${String(auditId)}-finding-${String(finding.id)}`,
        text: `${finding.title} ${finding.description ?? ''}`.trim(),
        metadata: {
          auditId,
          dimension: finding.dimension,
          priority: finding.priority,
          severity: finding.severity,
        },
      };
    });

    if (items.length === 0) {
      return true;
    }

    try {
      await this.embeddings.addEmbeddings(items);
      return true;
    } catch (error) {
      throw new IndexingError(`embeddings de l'audit ${String(auditId)}`, { cause: error });
    }
  }

  /**
   * Retire les embeddings d'un audit du magasin injecté.
   *
   * @param auditId - Identifiant de l'audit.
   * @returns Nombre de vecteurs retirés (0 sans magasin injecté).
   */
  async removeEmbeddings(auditId: number): Promise<number> {
    if (this.embeddings === undefined) {
      return 0;
    }

    const rows = this.db
      .prepare('SELECT id FROM audit_findings WHERE audit_id = ?')
      .all(auditId) as Array<{ id: number }>;
    const ids = rows.map(({ id }) => `audit-${String(auditId)}-finding-${String(id)}`);

    if (ids.length === 0) {
      return 0;
    }

    try {
      return await this.embeddings.removeEmbeddings(ids);
    } catch (error) {
      throw new IndexingError(`retrait des embeddings de l'audit ${String(auditId)}`, {
        cause: error,
      });
    }
  }

  /**
   * Indexe complètement un audit : plein texte, puis embeddings si injectés.
   *
   * @param audit - Audit persisté.
   * @returns Issue de l'indexation (lignes FTS + statut vectoriel).
   * @throws {IndexingError} Échec de l'un des deux chemins.
   */
  async indexAudit(audit: Audit): Promise<IndexationOutcome> {
    const auditId = audit.metadata.id;
    if (auditId === undefined) {
      throw new IndexingError("impossible d'indexer un audit non persisté (id absent)");
    }

    const ftsRows = this.indexAuditFTS(auditId);
    const vectorized = await this.addEmbeddings(audit);

    return { ftsRows, vectorized };
  }

  /**
   * Désindexe un audit : lignes FTS et embeddings.
   *
   * @param auditId - Identifiant de l'audit.
   * @returns Issue FTS (lignes retirées) — les vecteurs retirés sont
   *   comptabilisés par le magasin via {@link removeEmbeddings}.
   * @throws {IndexingError} Échec de l'un des deux chemins.
   */
  async deindexAudit(auditId: number): Promise<IndexationOutcome> {
    let ftsRows: number;

    try {
      const removed = this.db
        .prepare(
          `DELETE FROM audit_fts
            WHERE rowid IN (SELECT id FROM audit_findings WHERE audit_id = ?)`,
        )
        .run(auditId);
      ftsRows = removed.changes;
    } catch (error) {
      throw new IndexingError(`désindexation FTS de l'audit ${String(auditId)}`, {
        cause: error,
      });
    }

    const vectorized = (await this.removeEmbeddings(auditId)) > 0;

    return { ftsRows, vectorized };
  }
}
