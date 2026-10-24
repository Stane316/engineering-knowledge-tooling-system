import { MarkdownReportGenerator } from '../../reports/markdown-generator.js';
import { ResourceNotFoundError } from '../../shared/errors.js';
import type { McpToolContext } from '../context.js';
import type { AuditReportParams } from '../schemas/tool-schemas.js';

/** Résultat de `audit_report`. */
export interface AuditReportResult {
  readonly audit_id: number;
  readonly format: 'markdown' | 'text';
  readonly url: string;
  readonly report_content: string;
  readonly generated_at: string;
}

/**
 * Outil `audit_report` — génération du rapport Markdown d'un audit
 * (Sprint 11-3).
 *
 * Génération **en mémoire** (aucun fichier écrit côté serveur) : le contenu
 * est renvoyé directement au client MCP.
 *
 * @param context - Services partagés.
 * @param params - Paramètres déjà validés par Zod.
 * @returns Contenu Markdown + métadonnées de génération.
 * @throws {ResourceNotFoundError} Identifiant d'audit inconnu.
 */
export async function executeAuditReport(
  context: McpToolContext,
  params: AuditReportParams,
): Promise<AuditReportResult> {
  const audit = context.audits.repository.findById(params.audit_id);
  if (audit === null) {
    throw new ResourceNotFoundError(`audit #${String(params.audit_id)}`);
  }

  const report = await new MarkdownReportGenerator().generate(audit);

  return {
    audit_id: params.audit_id,
    format: params.format,
    url: audit.metadata.url,
    report_content: report.content,
    generated_at: report.generatedAt,
  };
}
