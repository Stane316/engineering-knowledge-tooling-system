# Sauvegarde, vérification et restauration

**Sprint :** 23-03 (C-O04) · **Portée :** les trois bases `ekts.db`, `ekts-fts.db`, `ekts-vectors.db`.

## 1. Ce qui est garanti — et ce qui ne l'est pas

Les trois bases sont attachées à **une** connexion, mais une copie de fichiers
n'est pas une transaction : les trois instantanés peuvent provenir d'instants
légèrement différents. Le manifeste déclare donc `nonAtomic: true` et compense
par une vérification de cohérence **ressources / index plein texte**.

Une sauvegarde incohérente est signalée, et la restauration est **refusée**.
Rien n'est réparé automatiquement : réindexer est une décision, pas un effet de
bord d'une restauration.

`VACUUM INTO` produit chaque copie : les fichiers `-wal` et `-shm` ne sont
**jamais** copiés — ils n'ont de sens qu'à côté de leur base. À la restauration,
d'éventuels `-wal`/`-shm` résiduels sont supprimés avant copie.

## 2. Commandes

```powershell
# Sauvegarde (le dossier cible doit être vide ou absent)
npm run db:backup -- --target .\sauvegardes\2026-10-31

# Vérification : format, tailles, empreintes SHA-256, intégrité, user_version
npm run db:verify -- --backup .\sauvegardes\2026-10-31

# Restauration (refusée si des bases existent, sauf --force)
$env:EKTS_DATA_DIR = ".\data-restauree"
npm run db:restore -- --backup .\sauvegardes\2026-10-31
```

`npm run build` est nécessaire avant ces commandes : elles utilisent `dist/`.

## 3. Contenu d'une sauvegarde

| Élément | Rôle |
| --- | --- |
| `ekts.db`, `ekts-fts.db`, `ekts-vectors.db` | copies cohérentes et compactées |
| `manifest.json` | empreintes, tailles, `user_version`, compteurs, cohérence, `nonAtomic` |

Une empreinte atteste des **octets comparés**, pas de l'authenticité de la
source : une sauvegarde peut être intègre et provenir d'une base erronée.

## 4. Reprise après interruption

Une opération non validée n'est **jamais** réputée persistée. Après un arrêt
brutal, la marche à suivre est :

1. ouvrir la base (`npm run db:inspect`) : SQLite annule la transaction ouverte ;
2. compter ressources et entrées FTS — l'écart est signalé par `db:verify` ;
3. si l'écart existe, réindexer (`npm run db:reindex`) est une **décision**,
   consignée dans le registre, jamais un automatisme ;
4. sauvegarder à nouveau, puis vérifier.

Mesuré le 31 octobre 2026 : après `SIGKILL` au milieu d'une écriture des données
et de l'index, la ressource validée subsistait et l'index FTS ne la contenait
pas — cohérence `false`, restauration refusée. Ce constat est un **résultat**,
pas un défaut masqué.
