# VPower777 — reprise projet (changement de PC)

Document **sans secrets**. Les clés / mots de passe sont dans `SECRETS_LOCAL.md` (ignoré par Git) et dans `.env` (ignoré par Git).

## Où est le code

- Repo GitHub : `git@github.com:tolojanaharystephan/vpower.git` — https://github.com/tolojanaharystephan/vpower
- Dossier local typique : Bureau → `vpower777`
- Staging : https://staging.vpower777.online  
- VPS : `45.32.102.170` — app `/var/www/vpower777` (mot de passe dans `SECRETS_LOCAL.md` uniquement)

## Vérif reprise PC (2026-09-16)

| Check | Résultat |
|--------|----------|
| Remote GitHub | OK → `tolojanaharystephan/vpower.git` |
| Commit local / `origin/main` | `31c5b5b` — *Fix staging client build…* |
| Staging site `/fr` | **200** — hall live |
| API `/health` | **ok** — DB up, Redis up |
| API `/health/ready` | **ok** |
| Flags staging | `paymentsEnabled=false`, `liveGamesEnabled=false`, `gameProviderMode=client` |
| Catalogue `/api/v1/catalog/games` | `[]` (normal : portail = salles, pas catalogue mock) |
| `POST …/platforms/dgames/enter` | **404** — module DGames **pas** dans le build API staging / GitHub |
| Admin `admin.staging…` | DNS / host **absent** (admin via autre voie ou non exposé) |
| Secrets locaux | `.env` + `SECRETS_LOCAL.md` **présents** sur ce PC |
| Transcript | `transcript.md` à la racine (export discussion autre PC) |

**Écart important :** le working tree local contient du **WIP DGames** (module API, UI play, migration `0014`, carte portail) **non poussé** sur GitHub. Or le **texte** staging affiche déjà « … · DGames » → staging a probablement reçu un déploiement partiel hors sync Git. Ne pas considérer DGames comme livré tant que l’API enter / callback n’est pas en prod staging + commit sur `main`.

## Stack

- Monorepo : Nest API + Next client/admin (`apps/api`, `apps/client-web`, `apps/admin-web`)
- Salles partenaires actuelles : `vblink`, `100plus`, `dragonfury` (+ `dgames` en cours)
- Modèle VBlink / Dragon Fury / 100plus : compte chez le partenaire + dépôt/retrait (passage)
- Modèle DGames : wallet seamless (solde chez nous ; eux appellent `getBalance` / `writeBet`)

## Ce qui est déjà livré (mémoire projet)

- Auth JWT, RBAC, wallets **par salle**
- Portail client (hall) + play VBlink / 100plus / Dragon Fury
- Support + chat agent dépôt / preuves (migration `0013`)
- Admin agents salle + master recettes
- Staging Vultr derrière nginx + Docker

## DGames — état (sept. 2026)

- Code : callback, catalog, play UI, migration `0014`
- GamesAPI host (client) :
  - Game List : `https://tbs2api.lvslot.net/API/`
  - openGame : `http://tbs2api.lvslot.net/API/openGame/` (on utilise la même base HTTPS `/API`)
- Env : `DGAMES_API_BASE_URL=https://tbs2api.lvslot.net/API`
- Credentials hall → `SECRETS_LOCAL.md` / `.env` (jamais Git)
- Callback staging à configurer dans le BO DGames :  
  `https://staging.vpower777.online/api/v1/providers/dgames/callback`
- Doc : [GAMES API EN](https://docs.google.com/document/d/1_e_Moi5Bn-Wy66DdT--XAdkrh-qI6ViBthLPBtb8zjQ/)

## Paiement / banque

- `PAYMENTS_ENABLED=false` — pas de PSP branché
- Client / banque demandent un **paiement cash** → en attente du **nom exact du système + doc API** (visite bureau / PDFs `guide-visite-allscale-paiement.pdf`, `AllScale API.pdf` à la racine)
- AllScale = piste doc paiement reçue ; pas encore d’intégration code

## Agents admin / chat dépôt

- Rôles agents salle, master recettes, chat dépôt avec preuves — migration `0013`, déployé staging précédemment.

## Secrets — règle d’or

| Fichier | Git ? | Rôle |
|--------|-------|------|
| `.env` | Non | Config runtime locale |
| `SECRETS_LOCAL.md` | Non | Backup clés + notes infra pour changer de PC |
| `transcript.md` | Non | Export discussion (volumineux) |
| `.env.example` | Oui | Modèle sans vraies valeurs |
| `PROJECT_HANDOFF.md` | Oui | Contexte (ce fichier) |

**Ne jamais** committer ni pousser `.env` / `SECRETS_LOCAL.md` (même repo privé : fuite possible via forks, collab, CI).

### Changer de PC

1. `git clone` le repo GitHub  
2. Copier depuis l’ancien PC (USB / Drive **privé**) : `.env` + `SECRETS_LOCAL.md` (+ WIP non poussé si besoin)  
3. Lire ce handoff + `docs/development-guide.md` + `transcript.md`  
4. Les discussions Cursor **ne voyagent pas** avec Git — le résumé utile est ici ; l’historique chat reste sur le compte / machine Cursor

## Prochaines actions utiles

1. Commit + push du WIP DGames (sans secrets) **ou** aligner staging sur GitHub si le label DGames est prématuré  
2. Obtenir `https://SERVER/API/` + confirmer hall chez DGames  
3. Compléter mot de passe VPS dans `SECRETS_LOCAL.md` si manquant  
4. Cadrer AllScale / cash banque une fois docs validées  
5. (Optionnel) Renommer la branche locale `origin/main` → `main` pour éviter l’ambiguïté Git

## Discussions Cursor

- Transcript export : `transcript.md` (racine, gitignored)
- Transcripts locaux Cursor : dossier agent du projet  
- Mettre à jour ce `PROJECT_HANDOFF.md` après décisions importantes
