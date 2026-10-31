# SPRINT-24-01 — Régressions transversales et CI — résultat

**Sprint parent :** [SPRINT-24](SPRINT-24.md) · **Base :** `c4c4a42` · **Date :** 31 octobre 2026
**Statut :** ⚠️ **4 critères sur 6 satisfaits · C-W03 partiel (PDF non exécuté) · CI distante BLOQUÉE**. Commit : **`e4ff0a3`**.

## 1. Objet

Assembler les preuves des critères M **sans changer ni méthode ni dénominateur**, et vérifier les scripts réellement présents ainsi que les jobs de CI sur la révision candidate.

## 2. Matrice de preuve — exécution réelle

Commande unique exécutée le 31/10/2026 sur `c4c4a42` :

```
npx vitest run tests/mcp/profile-exposure.test.ts tests/mcp/integration/stdio-profile.test.ts   tests/mcp/integration/events-observable.test.ts tests/docs/tool-inventory.test.ts   tests/storage/audit-diagnostics.test.ts tests/storage/audit-repository.test.ts   tests/integration/fts-repository.test.ts tests/mcp/tools/search-knowledge.test.ts   tests/reports/markdown-generator.test.ts tests/reports/html-generator.test.ts   tests/reports/pdf-generator.test.ts tests/reports/pdf-text-extraction.test.ts
```

**Résultat : 11 fichiers passés, 1 fichier sauté ; 97 tests passés, 5 sautés (102).**

| Critère | Fichiers exécutés | Cas | Verdict |
| --- | --- | --- | --- |
| **C-O05** compatibilité | `audit-repository` (32), `audit-diagnostics` (4) | **36/36** | ✅ |
| **C-O06** documentation | `tool-inventory` (2) | **2/2** — 17/17 outils confrontés à `tools/list`, liens locaux résolus | ✅ |
| **C-P01** découverte du profil | `profile-exposure` (7), `stdio-profile` (9) | **16/16** | ✅ |
| **C-R06** recherche | `fts-repository` (13), `search-knowledge` (7) | **20/20** | ✅ |
| **C-T01** événements | `events-observable` (5) | **5/5** | ✅ |
| **C-W03** rendus | `markdown-generator` (10), `html-generator` (5), `pdf-generator` (7 dont **4 sautés**), `pdf-text-extraction` (**1 sauté**) | **15/15** exécutés, **5 sautés** | ⚠️ **partiel** |

### 2.1 Pourquoi C-W03 n'est pas déclaré satisfait

Le seuil exige « les trois formats » (Markdown, HTML, PDF). Les cas PDF sont
**sautés** faute de binaire navigateur ; **un cas sauté n'est pas un succès**.
Markdown et HTML sont vérifiés ; **PDF ne l'est pas**. Je ne transpose donc pas
le résultat des deux premiers formats au troisième.

## 3. CI — ce qui a été observé, et ce qui n'a pas tourné

Configuration réelle : `.github/workflows/ci.yml` — matrice `ubuntu-latest` et
`windows-latest` × Node 22/24, plus benchmark 100 K documents, E2E MVP-3, audit
des dépendances et détection de secrets.

**Les jobs n'ont pas démarré.** Sortie observée (`gh run view 41220461921`) :

```
The job was not started because recent account payments have failed
or your spending limit needs to be increased.
```

| Élément | Constat |
| --- | --- |
| Scripts et jobs présents | ✅ oui |
| Jobs exécutés sur la révision candidate | ❌ **aucun** (facturation GitHub) |
| Statut de CI distante | **BLOQUÉ** — aucun statut ne peut être déclaré |
| Conséquence sur C-O02 | une CI `windows-latest` serait de toute façon **Windows Server**, pas le Windows 11 du propriétaire |

**Ce n'est pas un échec de code** : les étapes n'ont pas été lancées. Je ne
présente donc ni « CI verte » ni « CI rouge » — seulement **non exécutée**, avec
sa cause.

## 4. Prérequis et contradictions vérifiés

- `develop` pointe sur `c4c4a42`, **identique** à la branche de travail : la
  fusion attendue par le propriétaire a eu lieu ; je n'y touche pas.
- Contradiction `AGENTS.md` §1.6 (commit + push couplés) / consignes « aucun
  push » : **déjà arbitrée le 31/10 par le propriétaire** (commit + push) et
  appliquée sans nouvelle question.
- Les chemins cités par le dossier 24 existent ; aucun chemin devenu inexact
  n'a été constaté dans le périmètre de ce sous-sprint.

## 5. Limites et blocages

| # | Élément | Statut |
| --- | --- | --- |
| 1 | PDF (C-W03) | **bloqué** — binaire navigateur absent |
| 2 | CI distante | **bloquée** — facturation GitHub côté compte |
| 3 | Windows natif (C-O02) | **bloqué** — machine du propriétaire |
| 4 | Aucun statut de CI n'est revendiqué | — |

## 6. Référence de commit

Commit du sous-sprint : **`e4ff0a3`**.
