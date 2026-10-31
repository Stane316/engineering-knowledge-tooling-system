# Isolation du serveur MCP — procédure et limites

**Sprint 21-03 · C-P06 et C-P07 · 31 octobre 2026**
**Statut :** ✅ procédure appliquée et testée sur Linux · ⏳ vérification Windows à faire par le propriétaire

---

## 1. Le blocage et sa cause

Les deux critères restants du sprint 21 étaient déclarés **bloqués** avec le
motif « ni hôte isolé ni sandbox ». La cause réelle était double :

| Cause | Constat |
| --- | --- |
| **Absence de mécanisme** | Aucun moyen déclaré de prouver qu'aucune sortie réseau n'est possible ; une politique applicative se contourne par un bogue. |
| **Absence de banc d'essai** | Un hôte agent réel (OpenCode, Hermes) n'était pas disponible pour jouer l'injection. |

Le second point reste partiellement vrai : **un hôte agent réel n'a pas été
utilisé**. Ce qui a changé, c'est qu'un hôte n'est **pas nécessaire** pour
mesurer C-P06/C-P07 : les deux critères portent sur le **serveur**, pas sur le
client. Un client JSON-RPC scripté suffit à tenter les 17 outils et à lire une
ressource hostile.

## 2. Recherche menée (31/10/2026)

Sources consultées et convergentes :

- pratiques de confinement des serveurs MCP : isolation par *namespace* ou
  conteneur, sortie réseau **`default-deny`**, processus non-root, surface
  d'appels système réduite ;
- recommandations OWASP/sécurité MCP : le contenu tiers est une **donnée non
  fiable**, jamais une instruction ; les traces doivent journaliser les appels
  sans divulguer de secrets ;
- constat partagé : la *containerisation seule ne suffit pas* — sans contrôle
  de sortie, l'exfiltration reste triviale.

**Conclusion retenue :** l'isolation par **namespace réseau** est le contrôle de
référence, disponible nativement sous Linux, et vérifiable sans installer quoi
que ce soit.

## 3. Procédure appliquée

### 3.1 Principe

Le serveur MCP est lancé dans un *network namespace* Linux créé par
`unshare -rn` :

```text
unshare -r  → user namespace (permet l'opération sans privilège)
unshare -n  → network namespace : seule l'interface `lo` existe, DOWN
```

Conséquence : **toute** tentative de sortie réseau échoue au niveau du noyau.
Ce n'est pas une politique applicative qu'un bogue pourrait désactiver, ni une
liste de domaines à tenir à jour.

### 3.2 Vérification du mécanisme

```bash
unshare -rn node -e "require('dns').lookup('github.com',(e)=>process.exit(e?0:1))"
# sortie 0 = la résolution a échoué comme attendu
```

### 3.3 Application au serveur

```bash
unshare -rn env EKTS_DATA_DIR=./data EKTS_MCP_PROFILE=read \
  node dist/mcp/server.js
```

### 3.4 Ce que mesure le test

`tests/mcp/integration/isolation-sandbox.test.ts` (6 cas verts) :

| Cas | Critère | Mesure |
| --- | --- | --- |
| Réseau réellement absent | C-P06 | sonde DNS dans le namespace → échec attendu |
| 3 outils exposés | C-P06 | `tools/list` sous `read` = exactement 3 |
| Contraste | C-P06 | sous `full`, **17** outils → les 14 manquants existent bien |
| 14 outils refusés | C-P07 | 14/14 en erreur, **0 mutation** métier |
| Ressource hostile lisible | C-P07 | V02 restituée à l'octet près, **aucune instruction exécutée** |
| Canari non divulgué | C-P07 | canari aléatoire dans l'environnement → absent des réponses **et** des traces |

Le canari est **régénéré à chaque exécution** (`randomUUID`) : il ne peut pas
être présent dans une fixture, donc son absence des traces est une vraie
mesure, pas une coïncidence.

## 4. Limites — ce que cette preuve ne dit pas

- **Ce n'est pas une machine virtuelle.** Le noyau est partagé ; une évasion de
  noyau reste théoriquement possible. Pour un isolement plus fort, il faudrait
  gVisor, Firecracker ou un hôte séparé — hors périmètre actuel.
- **Un hôte agent réel n'a pas été utilisé.** C-P07 est prouvé au niveau du
  serveur ; le comportement d'OpenCode ou de Hermes face à V02 n'est **pas**
  mesuré. C'est l'objet des sprints d'intégration (cf. révision roadmap).
- **`unshare` est spécifique à Linux.** Sur Windows, le cas est **ignoré avec sa
  raison** dans la suite, jamais compté comme réussi.
- **Le canari couvre les traces du serveur**, pas celles du client ni du modèle.
- **Aucun test offensif** n'a été mené contre une cible externe.

## 5. Protocole Windows (à exécuter par le propriétaire)

L'isolation par namespace n'existe pas telle quelle sous Windows 11. Deux
options, à arbitrer :

| Option | Moyen | Portée |
| --- | --- | --- |
| **W1 — pare-feu applicatif** | Règle de trafic sortant bloquant un binaire nommé (`New-NetFirewallRule -DisplayName "EKTS-MCP-block" -Direction Outbound -Program "<chemin>\node.exe" -Action Block`) | Isole **par programme**, pas par processus : bloque aussi les autres usages de `node.exe`. Acceptable pour un test, pas pour un usage quotidien. |
| **W2 — conteneur** | WSL2 + `unshare -rn` identique à Linux, ou conteneur Docker | Isole réellement, mais ne teste plus le Windows natif |

**Recommandation :** W2 (WSL2) pour la **preuve d'isolation**, et réserver le
Windows natif aux critères de compatibilité (S23-02 : chemins, UTF-8, WAL, ACL).
W1 est un palliatif de démonstration, pas une isolation.

```powershell
# Vérification W2 : dans WSL2, la sonde doit échouer comme sous Linux
wsl -d Ubuntu -- bash -c "unshare -rn node -e \"require('dns').lookup('github.com',(e)=>process.exit(e?0:1))\"; echo exit=\$?"
# attendu : exit=0  (l'échec de résolution est le résultat attendu)
```

## 6. Ce qu'il reste à faire

| Élément | Statut |
| --- | --- |
| C-P06 applicatif + isolation réseau réelle | ✅ mesuré sous Linux |
| C-P07 refus des 14 outils, canari, contenu hostile | ✅ mesuré sous Linux |
| Isolation vérifiée sur l'hôte Windows du propriétaire | ⏳ protocole § 5 fourni |
| Comportement d'un hôte agent réel (OpenCode, Hermes) | ⏳ sprint d'intégration dédié |
| `C-P07` au sens strict de G1 (exposition T06 observée) | ⚠️ **reste bloqué** : exige un hôte agent réel, pas un client scripté |
