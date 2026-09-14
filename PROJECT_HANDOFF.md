# VPower777 — reprise projet (changement de PC)

Document **sans secrets**. Les clés / mots de passe sont dans `SECRETS_LOCAL.md` (ignoré par Git) et dans `.env` (ignoré par Git).

## Où est le code

- Repo GitHub : `git@github.com:tolojanaharystephan/vpower.git`
- Dossier local typique : Bureau → `vpower777`
- Staging : https://staging.vpower777.online  
- VPS : `45.32.102.170` — app `/var/www/vpower777` (mot de passe dans `SECRETS_LOCAL.md` uniquement)

## Stack

- Monorepo : Nest API + Next client/admin (`apps/api`, `apps/client-web`, `apps/admin-web`)
- Salles partenaires actuelles : `vblink`, `100plus`, `dragonfury` (+ `dgames` en cours)
- Modèle VBlink / Dragon Fury / 100plus : compte chez le partenaire + dépôt/retrait (passage)
- Modèle DGames : wallet seamless (solde chez nous ; eux appellent `getBalance` / `writeBet`)

## DGames — état (sept. 2026)

- Code intégré (callback, catalog, play UI, migration `0014`)
- Credentials reçus client (Hall ID / key) → détails dans `SECRETS_LOCAL.md`
- **Bloqué** : URL API jeux `https://SERVER/API/` manquante ; `/API/` sur `api.dgamesonline.com` = 404 ; `?act=api` ≠ API jeux
- Callback staging à configurer chez eux :  
  `https://staging.vpower777.online/api/v1/providers/dgames/callback`
- Doc fournisseur : [GAMES API EN](https://docs.google.com/document/d/1_e_Moi5Bn-Wy66DdT--XAdkrh-qI6ViBthLPBtb8zjQ/)

### Message type à envoyer au client

> D’après le doc que dgamesonline vous a envoyé (GAMES API EN), pour brancher la salle on a besoin de :  
> 1) URL API `https://SERVER/API/` ; 2) confirm Hall ID + Key ; 3) devise du hall ;  
> 4) Callback URL hall = `https://staging.vpower777.online/api/v1/providers/dgames/callback`.

## Agents admin / chat dépôt

- Rôles agents salle, master recettes, chat dépôt avec preuves — migration `0013`, déployé staging précédemment.

## Secrets — règle d’or

| Fichier | Git ? | Rôle |
|--------|-------|------|
| `.env` | Non | Config runtime locale |
| `SECRETS_LOCAL.md` | Non | Backup clés + notes infra pour changer de PC |
| `.env.example` | Oui | Modèle sans vraies valeurs |
| `PROJECT_HANDOFF.md` | Oui | Contexte (ce fichier) |

**Ne jamais** committer ni pousser `.env` / `SECRETS_LOCAL.md` (même repo privé : fuite possible via forks, collab, CI).

### Changer de PC

1. `git clone` le repo GitHub  
2. Copier depuis l’ancien PC (USB / Drive **privé**) : `.env` + `SECRETS_LOCAL.md`  
3. Lire ce handoff + `docs/development-guide.md`  
4. Les discussions Cursor **ne voyagent pas** avec Git — le résumé utile est ici ; l’historique chat reste sur le compte / machine Cursor

## Discussions Cursor

- Transcripts locaux (machine actuelle) : dossier agent Cursor du projet, pas dans ce repo  
- Pour garder le fil : mettre à jour ce `PROJECT_HANDOFF.md` après décisions importantes
