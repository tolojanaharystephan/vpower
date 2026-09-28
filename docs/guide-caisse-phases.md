# Guide caisse, jeu et phases restantes

Staging : https://staging.vpower777.online

Ce fichier décrit le lien entre le compte qui encaisse, AllScale et le jeu, puis les scénarios encore à passer. Aucun secret (clés API, mots de passe) n’est écrit ici.

## Le lien : compte d’encaissement, AllScale, jeu

Trois choses distinctes se parlent dans cet ordre.

1. **Le compte AllScale qui encaisse**  
   Compte marchand **fang30808@gmail.com**, store **vpower777**. C’est la caisse. L’argent réel du joueur (carte ou USDT/USDC) arrive là. AllScale règle ce store en **USDC**. Ce compte ne lance pas de jeu et ne connaît pas le catalogue.

2. **AllScale Checkout**  
   Page de paiement. VPower777 lui envoie le montant saisi (minimum 5 $), la salle choisie et le joueur. Quand le paiement est accepté, AllScale appelle le webhook staging :  
   `https://staging.vpower777.online/api/v1/payments/allscale/webhook`  
   VPower777 vérifie la signature, retrouve la commande, et **crédite le portefeuille de cette salle pour ce joueur**. Sans ce webhook, l’argent peut être chez AllScale et le solde de jeu rester à 0.

3. **Le jeu**  
   Le joueur a un compte VPower777 et **une seule caisse**. Un dépôt, un crédit d’agent ou un gain augmente ce même solde. dgamesonline lit et débite cette caisse (`getBalance` / `writeBet`), quelle que soit la salle affichée avant. Ce solde est un crédit de jeu chez nous, en dollars, pas le solde USDC du store AllScale.
   - **VBlink, Dragon Fury, 100plus** : le même compte ouvre leur lobby. Le nombre de jeux reste celui du partenaire. Leur site partenaire a encore sa propre caisse tant qu’un transfert automatique n’est pas branché.
   - **dgamesonline** : les mises partent de la caisse VPower777.

En une phrase : le joueur paie sur AllScale, l’argent reste sur le store vpower777, et VPower777 ajoute le même montant au portefeuille de la salle pour que le jeu puisse s’en servir.

```text
Joueur saisit 20 $ sur dgamesonline
        → page AllScale (carte ou crypto)
        → argent encaissé sur le store vpower777 (USDC)
        → webhook
        → caisse unique du joueur +20 $
        → une mise dans n’importe quelle salle dgamesonline baisse cette caisse
```

VBlink, Dragon Fury et 100plus affichent le même chiffre. Ils ne créent plus un deuxième solde.

## Compte joueur et nombre de jeux

Demande du client : un joueur a un compte pour jouer chez VPower777, mais pas le même nombre de jeux partout.

C’est déjà le cas sur staging.

- **Un compte.** Sans connexion VPower777, aucun jeu ne se lance. Le même compte ouvre les quatre salles.
- **Pas le même nombre de jeux.** Chaque salle a son propre catalogue. VBlink, Dragon Fury et 100plus ouvrent le lobby du partenaire : la liste et le nombre de titres sont les leurs. dgamesonline ouvre le catalogue GamesAPI branché sur le hall VPower777, filtré des jeux qui ne démarrent pas. Ce n’est ni la même liste ni le même nombre que les trois autres.

Le compte ne donne pas un paquet unique de jeux. Il donne le droit d’entrer. La salle choisie décide combien de jeux sont là.

**Scénario 11 — Même compte, catalogues différents.** Léa se connecte une fois. Sur VBlink elle voit le lobby VBlink. Sur dgamesonline elle voit une autre liste, plus courte ou plus longue, avec d’autres titres. Elle ne crée pas un deuxième compte pour changer de salle. Déconnectée, les deux écrans de jeu lui demandent de se connecter.

## Déjà en place

- Compte VPower777 obligatoire pour lancer un jeu.
- Une seule caisse. Elle alimente la salle ouverte. dgamesonline débite cette caisse.
- Langues, dans cet ordre : anglais, chinois, japonais, coréen, mongol, espagnol, néerlandais, français. Le site s’ouvre en français.
- Dépôt en ligne : montant saisi, minimum 5 $. Plus de boutons 10 $, 20 $, 50 $.
- Cash App, PayPal, Zelle, Venmo, Chime : pas sur AllScale. Passage par l’agent de la salle, avec une preuve.
- Un super-admin crée et modifie les agents. Un agent par salle.

## 1. Dépôt réel sur staging

But : un vrai paiement carte ou crypto, et la caisse unique qui augmente du même montant.

1. Se connecter (le compte démo `persontest@gmail.com` convient).
2. Ouvrir Mon compte. Noter le solde de la caisse.
3. Cliquer Déposer, saisir un montant (`15` ou `15,50`), puis Continuer.
4. Sur AllScale, payer par carte ou en USDT / USDC.
5. Revenir sur Mon compte et rafraîchir. La caisse a augmenté de ce montant. Le même chiffre apparaît sur chaque salle.

Minimum AllScale : 5 $. Durée de la page de paiement : au moins 30 minutes.

**Scénario 1 — Carte, succès.** Marie est connectée. Sa caisse est à 0 $. Elle saisit 20 $ et paie par carte. Au retour, la caisse affiche 20 $, sur dgamesonline comme sur VBlink. Les 20 $ encaissés sont sur le store AllScale vpower777.

**Scénario 2 — Crypto, succès.** La caisse est à 10 $. Elle saisit 25 $ et paie en USDT. La caisse passe à 35 $, pour n’importe quelle salle.

**Scénario 3 — Montant refusé.** Elle saisit `3` ou laisse le champ vide. Le site demande au moins 5 $ et n’ouvre pas AllScale.

**Scénario 4 — Paiement abandonné.** Elle saisit 15 $, arrive sur AllScale, puis ferme la page sans payer. Le portefeuille ne change pas. Rien n’est encaissé sur le store.

**Scénario 5 — Jeu après dépôt.** Après le scénario 1, elle ouvre un titre dgamesonline. La mise se déduit du portefeuille dgamesonline. Sans compte VPower777, l’écran demande de se connecter et le jeu ne s’ouvre pas.

## 2. Phase 2 — Cash App, PayPal, Zelle, Venmo, Chime

Ces moyens n’alimentent pas AllScale. L’agent de la salle crédite le portefeuille après preuve. L’argent n’arrive pas tout seul sur le store vpower777.

1. Le joueur ouvre Support, indique la salle, le montant et le moyen.
2. Il envoie la preuve (capture ou référence).
3. L’agent de cette salle vérifie et crédite ce portefeuille.
4. Le joueur rafraîchit Mon compte.

**Scénario 6 — Preuve acceptée.** Paul veut 50 $ sur Dragon Fury via Zelle. Il écrit à l’agent Dragon Fury avec la capture. L’agent crédite 50 $. Dragon Fury augmente de 50 $. Les autres salles ne changent pas.

**Scénario 7 — Preuve refusée.** Capture illisible ou montant différent. L’agent ne crédite pas. Le solde reste identique.

**Scénario 8 — Mauvaise salle.** Paul paie pour 100plus mais écrit à l’agent VBlink. L’agent VBlink ne crédite pas 100plus. Il faut l’agent de la salle à alimenter.

## 3. Production

À lancer seulement quand le scénario 1 est passé sur staging (le scénario 2 en plus, si la crypto doit être validée aussi).

1. Store et webhook AllScale de production, carte activée, minimum 5 $, URL de prod à la place de l’URL staging.
2. Callback DGames du hall pointé vers l’URL de production.
3. Déployer avec les clés de production, paiements activés.
4. Refaire le scénario 1 avec un petit montant, puis une mise dgamesonline : le portefeuille monte, puis baisse.
5. Vérifier qu’un agent peut encore créditer après une preuve Cash App, PayPal, Zelle, Venmo ou Chime.

**Scénario 9 — Go-live.** Le dépôt staging de 20 $ est bien arrivé sur dgamesonline et sur le store AllScale. On bascule les URLs AllScale et DGames vers la production, on rejoue un dépôt de 5 $ et une petite mise. Le solde monte, puis baisse du montant de la mise. Ensuite seulement, on ouvre les joueurs réels.

**Scénario 10 — On ne bascule pas.** Le paiement AllScale réussit mais le portefeuille staging ne bouge pas. On corrige le webhook sur staging. La production reste fermée.
