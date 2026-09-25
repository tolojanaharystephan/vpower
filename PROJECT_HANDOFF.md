# VPower777 — reprise projet (changement de PC)

Document **sans secrets**. Les clés / mots de passe sont dans `SECRETS_LOCAL.md` (ignoré par Git) et dans `.env` (ignoré par Git).

## Où est le code

- Repo GitHub : `git@github.com:tolojanaharystephan/vpower.git` — https://github.com/tolojanaharystephan/vpower
- Dossier local typique : Bureau → `vpower777`
- Staging : https://staging.vpower777.online  
- VPS : `45.32.102.170` — app `/var/www/vpower777` (mot de passe dans `SECRETS_LOCAL.md` uniquement)

## Stack

- Monorepo : Nest API + Next client/admin (`apps/api`, `apps/client-web`, `apps/admin-web`)
- Salles partenaires actuelles : `vblink`, `100plus`, `dragonfury`, `dgames`
- Modèle VBlink / Dragon Fury / 100plus : compte chez le partenaire + dépôt/retrait (passage)
- Modèle DGames : wallet seamless (solde chez nous ; eux appellent `getBalance` / `writeBet`)

## DGames — état (sept. 2026)

- Code : callback, catalog, play UI, migration `0014`
- GamesAPI host : `https://tbs2api.dark-a.com/API/` (pin DNS `185.192.23.13`)
- Compte BO : **Ft16890** — login OK sur `tbs2api.dark-a.com`
- Hall créé : **VPower777** — ID `3211871`, seamless, USD, Active
- Hall Key + Callback dans Hall Settings (callback staging collé)
- Callback : `https://staging.vpower777.online/api/v1/providers/dgames/callback`
- Staging : `DGAMES_ENABLED=true`, GetBalance OK, openGame OK (Novomatic / Amatic / …)
- Catalogue : pack sans provider (`…/ig/…`, ~20 titres type Griphons Gold) → `fail_OPENSESSION` — filtré côté API
- Demo testé : `persontest@gmail.com` → login provider `vpe88774bb77a4`

## Paiement / banque

- Compte AllScale VPower : **fang30808@gmail.com** — store **vpower777** (`6aaab364cdf923914bf9e866`, Live)
- `PAYMENTS_ENABLED` + **AllScale Checkout** (Phase 1) : crypto USDT/USDC + carte/local (Pay with Card **ON**)
- Env : `ALLSCALE_API_KEY`, `ALLSCALE_API_SECRET`, `ALLSCALE_BASE_URL=https://openapi.allscale.io`
- Webhook store (configuré) :  
  `https://staging.vpower777.online/api/v1/payments/allscale/webhook`
- Migration `0015_payment_orders`
- Dashboard OK : webhook collé + Pay with Card enabled (settlement USDC, min $5, validity ≥30 min)
- Staging live (`1c1187e`) : `PAYMENTS_ENABLED=true`, migration `0015` au boot, webhook répond `401` sans signature (attendu)
- Phase 2 (plus tard) : Cash App / PayPal / Zelle / Venmo / Chime (autre PSP ou agent)

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

1. Test dépôt AllScale staging (compte demo ou fonds de test)  
2. Prod AllScale / DGames seulement après validation staging  
3. (Optionnel) Renommer la branche locale `origin/main` → `main` pour éviter l’ambiguïté Git

## Discussions Cursor

- Transcript export : `transcript.md` (racine, gitignored)
- Transcripts locaux Cursor : dossier agent du projet  
- Mettre à jour ce `PROJECT_HANDOFF.md` après décisions importantes
