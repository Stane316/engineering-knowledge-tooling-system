# SPRINT-24-03 — Matrice G1/G2 et décision finale — résultat

**Sprint parent :** [SPRINT-24](SPRINT-24.md) · **Base :** `437b968` · **Date :** 31 octobre 2026 · **Dernière révision :** `c8e7c22` (intégration de la mesure C-O02)
**Statut :** ⛔ **G1 et G2 NON ATTEINTS — aucun pilote autorisé**. Commit initial : `da7c4df` ; **version courante : `c8e7c22`** (matrice mise à jour après la mesure Windows).

## 1. Matrice de preuve, critère par critère

| Critère | Date | Machine / version | Commande | Prévus | Réussis | Bloqués / sautés | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-P01 | 31/10 | Linux 6.1.158 · Node 22.22.3 | `vitest … profile-exposure stdio-profile` | 16 | 16 | 0 | ✅ |
| C-P06 | 30/10 | idem, `unshare -rn` | `isolation-sandbox.test.ts` | 7 | 6 | 1 (hors Linux) | ✅ sur Linux |
| C-P07 | — | — | hôte agent réel requis | — | 0 | **tous** | ⛔ bloqué |
| C-T01 | 31/10 | idem | `events-observable` + binaire | 6 | 6 | 0 | ✅ |
| C-O04 | 31/10 | idem | `backup.test.ts` | 6 | 6 | 0 | ✅ (1 constat P3) |
| C-O05 | 31/10 | idem | `audit-*` | 36 | 36 | 0 | ✅ |
| C-O06 | 31/10 | idem | `tool-inventory` | 2 | 2 | 0 | ✅ |
| C-O07 | 31/10 | Linux (référence) · Windows (O7-B) | `npm run bench:latency` | 2 | 2 | 0 | ✅ O7-A (p95 0,73–0,77 ms) ; ✅ **O7-B conforme** (p95 exact non transmis) |
| C-T03 | 31/10 | idem | `traces-confidentiality` + compte `ekts-probe` | 5 + 1 | 5 + 1 | 0 | ✅ POSIX ; **ACL Windows bloquées** |
| C-W03 | 31/10 | idem | `reports/*` | 20 | 15 | **5 (PDF)** | ⚠️ partiel |
| C-O02 | 31/10 | **Windows 11 Pro build 26300 · i5-8250U · Node 24.14.0 · npm 11.21.0** | `windows-check.ps1` (commit `dfb371e`) | 9 | **9** | 0 | ✅ **satisfait sur cette configuration** |
| C-O03 | 31/10 | Windows 11 + compte `ekts-probe` (POSIX) | `icacls`, `cat` | 2 | 1 | **1** (refus effectif Windows) | ⛔ **bloqué** |
| C-T04/T05/T06 | — | — | campagne A/C/B | — | 0 | **toutes** | ⛔ bloqués (G0 fermé) |

Les compteurs proviennent des exécutions consignées aux rapports 23-01 à 24-02 ;
aucun chiffre n'est extrapolé.

## 2. Portes

| Porte | Condition | État | Motif |
| --- | --- | --- | --- |
| **G0** | hôte, modèle, fournisseur, budget, comptes | ⛔ **fermée** | cinq champs non fournis (24-02 § 2) |
| **G1** | critères techniques M et P satisfaits | ⛔ **non atteint** | **C-P07 bloqué**, C-W03 partiel, **C-O03 bloqué** ; C-O02 levé |
| **G2** | décision de valeur sur corpus réel | ⛔ **non atteint** | aucune campagne ; l'ingestion (S25) n'est pas commencée |
| **G3** | décision du propriétaire | ⏳ **à venir** | dépend de G0–G2 |

## 3. Décision finale

**Aucun pilote n'est autorisé.** Le système est **conforme sur les critères
techniques mesurables** et **non démontré sur la valeur comparative** : ce sont
deux constats différents, et le second ne découle pas du premier.

Ce qui empêche G1 est nommé, pas contourné : le confinement vérifiable au sens
strict (C-P07) et le rendu PDF (C-W03). **C-O02 est levé** — mesuré et satisfait
sur Windows 11 build 26300 ; **C-O03 reste bloqué** (refus effectif non testé
sur Windows, faute de second compte).

## 4. Ce qu'il faudrait pour avancer

1. Restaurer la CI (facturation GitHub) : sans elle, aucun statut distant.
2. Exécuter `scripts/windows-check.ps1` sur le poste Windows 11.
3. Fournir le second compte Windows pour C-O03 (et le p95 de O7-B depuis le JSON).
4. Fournir les cinq champs G0 pour ouvrir la campagne A/C/B.
5. Lever C-P07 : hôte agent réel autorisé, avec contrôle réseau observable.
