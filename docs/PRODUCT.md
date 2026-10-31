# Vision produit & go/no-go

## Cible

Établissements scolaires et services éducatifs au Cameroun.

Agent configuré en français avec :
- leurs cours et FAQ
- réponses rapides
- horaires
- demandes de contact
- transfert à un humain

Plus facile à expliquer et à vendre qu’un « chatbot qui fait tout ».

Premier pilote : **Mathsfor.all / CMR SCHOOL**.

## Ce que le client paie

- Création de compte + assistant de configuration
- Réglage du prompt et des réponses
- Statistiques d’utilisation
- Journaux d’erreur
- Gestion des administrateurs
- Abonnement (essai + forfaits limités par agents / messages)

## Points bloquants (à résoudre avant de vendre)

1. **Connexion WhatsApp commerciale**  
   Cloud API validée pour le cas éducatif.  
   Baileys = prototype privé seulement.

2. **Publication dans les chaînes**  
   Pas d’API officielle confirmée → ne pas promettre.

3. **Coûts variables**  
   Hébergement + modèles IA + messages WhatsApp.  
   Éviter l’« illimité » au départ.

4. **Paiements in-app (plus tard)**  
   Apple et Google exigent généralement leur système pour les fonctionnalités numériques dans les apps mobiles.

## Go / No-go

| Critère | Statut |
|---------|--------|
| Connexion Cloud API autorisée et exploitable pour le cas d’usage | À valider |
| Quelques clients prêts à payer et à renouveler | À prouver |

## Roadmap courte

1. Dashboard web fonctionnel (ce dépôt)
2. Intégration Cloud API (webhook + envoi)
3. Pilote payant 3–5 établissements
4. Mesure du coût réel par client
5. App Flutter (réutiliser les écrans)
