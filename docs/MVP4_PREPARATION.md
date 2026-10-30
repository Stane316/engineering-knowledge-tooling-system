# Préparation MVP-4

> **Révision du 30 octobre 2026 — historique conservé :** les options et la recommandation de collaboration ci-dessous décrivent la préparation du 26 octobre, non la trajectoire actuelle. Le propriétaire a depuis validé une vision recentrée sur fiabilité web, permissions, provenance et accès agentique local, ainsi que l'architecture, la spécification et leurs seuils. La collaboration distante est reportée, sans échéance ; voir l'unique [roadmap de trajectoire](ROADMAP.md) et les [références détaillées](audit/produit/README.md). Cette révision ne modifie pas silencieusement ADR-044 et ne constitue ni un feu vert de développement, ni une autorisation d'expérience, de PR ou de publication.

> Options pour le prochain MVP. **ADR-044 : le MVP-4 est documenté mais
> non implémenté** — aucun développement ne démarre sans feu vert
> explicite de l'utilisateur (règle maison, identique à S13-S18).

## Statut

**MVP-3 terminé et validé le 26 octobre 2026 — 97/97 lignes-critères**
([`MVP3_VALIDATION.md`](MVP3_VALIDATION.md), rapport :
[`blueprint/Docs/roadmap/sprints/SPRINT-18-RESULTAT.md`](blueprint/Docs/roadmap/sprints/SPRINT-18-RESULTAT.md)).

Le MVP-4 est **optionnel**. Les 4 options ci-dessous sont celles du spec
Sprint 18 ; toute nouvelle idée s'ajoute ici sans engager le planning.

## Options envisagées

### Option 1 — Collaboration (≈ 8 semaines)

Partager projets, audits et recommandations entre équipes :
authentification, partage de projets, commentaires d'audit,
notifications, rapports d'équipe.

- **Avantages** : valeur immédiate, complète naturellement le MVP-3
  (projets → équipes), review entre pairs.
- **Inconvénients** : backend + base distante, permissions,
  synchronisation — **rupture avec l'architecture actuelle 100 % locale
  SQLite** (3 bases fichiers, aucun serveur applicatif).

### Option 2 — Intégrations (≈ 6 semaines)

Slack/Teams (notifications), Jira/Trello (tickets), GitHub/GitLab
(CI/CD), webhooks personnalisés.

- **Avantages** : workflow automatisé, adoption facilitée.
- **Inconvénients** : maintenance des intégrations, tokens et surface de
  sécurité (le projet gère déjà 14+ clés via la trousse maison — voir
  `docs/guides/PROVIDERS.md`).

### Option 3 — Intelligence artificielle (≈ 8 semaines)

Détection de patterns (ML), prédiction de régressions au-delà de la
régression linéaire actuelle, assistant conversationnel, rapports
narratifs.

- **Avantages** : différenciation sur la base déjà capitalisée
  (audits, bonnes pratiques, recommandations).
- **Inconvénients** : coût, données d'entraînement ; l'espace
  d'embeddings existant (ADR-016) impose toute nouvelle mesure de
  similarité d'être compatible.

### Option 4 — Marketplace (≈ 10 semaines)

Partage communautaire de templates (les 10 builtins aujourd'hui) et de
plugins, notation, intégrations tierces.

- **Avantages** : écosystème, innovation ouverte.
- **Inconvénients** : modération, qualité variable, plateforme à tenir —
  dépend de l'option 1 (comptes) ou d'un export/import déjà disponible
  (`ekts template export/import`).

## Recommandation transmise

**Option 1 (Collaboration)** en priorité — elle complète le MVP-3
(projets → équipes) et conditionne les options 2/4. **Décision requise**
avant toute rédaction de spec.

## Prochaines étapes (aucune engagée)

1. Utilisateur : choisir une option (ou rejeter le MVP-4).
2. Rédiger la spec MVP-4 (format SPRINT-XX.md, critères C18.x…).
3. Décomposer en sous-sprints.
4. **Feu vert explicite**.
5. Démarrage sur la branche d'intégration `develop` (processus maison).

---

**Document créé le 26 octobre 2026 — ADR-044 : en attente de décision.**
