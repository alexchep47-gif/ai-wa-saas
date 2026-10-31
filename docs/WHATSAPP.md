# WhatsApp — règles et coûts

## Cloud API (voie recommandée)

- Documentation officielle : [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- Messages hors fenêtre de service 24 h : templates pré-approuvés
- Catégories de messages et tarification selon le pays du destinataire
- Conditions relatives aux fournisseurs IA : vérifier les règles Meta actuelles

## Chaînes (Channels)

- Non documenté pour la publication automatisée dans la Cloud API
- Réponse communauté Meta : non supporté
- Traitement : fonction expérimentale ou calendrier manuel

## Baileys

Voir `lib/whatsapp/baileys-note.md`.
Réservé au prototype privé.

## Consentement & confidentialité

Les conversations envoyées à Gemini (ou autre) doivent être expliquées aux clients.
Apple exige d’indiquer le partage avec des services d’IA tiers et d’obtenir le consentement.
