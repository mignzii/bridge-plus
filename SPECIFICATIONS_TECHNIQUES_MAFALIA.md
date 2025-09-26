# 🔧 Spécifications Techniques - Intégration Mafalia

## 📋 Informations de connexion

```
URL Base: https://bridge-plus.com
Token: mafalia-api-token-2025
```

## 📡 Endpoints API

### 1. Synchronisation complète
```
POST /api/bridge/sync/restaurant
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json
```

### 2. Synchronisation catégories
```
POST /api/bridge/sync/categories
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json
```

### 3. Synchronisation produits
```
POST /api/bridge/sync/products
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json
```

### 4. Statut de synchronisation
```
GET /api/bridge/sync/status/{restaurantId}
Authorization: Bearer mafalia-api-token-2025
```

## 📊 Structure des données

### Restaurant
```json
{
  "id": "string (ID Mafalia)",
  "nom_restaurant": "string",
  "statut": "string (ouvert/ferme)",
  "image": "string (URL, optionnel)"
}
```

### Catégorie
```json
{
  "id": "string (ID Mafalia)",
  "nom_categorie": "string"
}
```

### Produit
```json
{
  "id": "string (ID Mafalia)",
  "nom_produit": "string",
  "prix": "number",
  "description": "string (optionnel)",
  "image": "string (URL, optionnel)",
  "note": "number (optionnel)",
  "restaurant_id": "string (ID Mafalia du restaurant)",
  "categorie_id": "string (ID Mafalia de la catégorie, optionnel)",
  "accompagnants": "array (optionnel)"
}
```

## 🔄 Logique de synchronisation

- **Restaurant existant** → Mise à jour
- **Restaurant nouveau** → Création
- **Catégorie existante** → Mise à jour
- **Catégorie nouvelle** → Création
- **Produit existant** → Mise à jour
- **Produit nouveau** → Création

## 📝 Exemple de requête complète

```json
{
  "restaurant": {
    "id": "mafalia_restaurant_001",
    "nom_restaurant": "Mon Restaurant",
    "statut": "ouvert"
  },
  "categories": [
    {
      "id": "mafalia_cat_001",
      "nom_categorie": "Fast Food"
    }
  ],
  "produits": [
    {
      "id": "mafalia_prod_001",
      "nom_produit": "Burger Deluxe",
      "prix": 5000,
      "restaurant_id": "mafalia_restaurant_001",
      "categorie_id": "mafalia_cat_001"
    }
  ]
}
```

## ✅ Réponse de succès

```json
{
  "success": true,
  "message": "Synchronisation réussie",
  "data": {
    "restaurant_id": "uuid-bridge-restaurant",
    "categories_mapping": {
      "mafalia_cat_001": "uuid-bridge-category"
    },
    "produits_mapping": {
      "mafalia_prod_001": "uuid-bridge-product"
    }
  }
}
```

## ❌ Codes d'erreur

- `400` - Données invalides
- `401` - Authentification requise
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## 🧪 Test rapide

```bash
curl -X POST https://bridge-plus.com/api/bridge/sync/restaurant \
  -H "Authorization: Bearer mafalia-api-token-2025" \
  -H "Content-Type: application/json" \
  -d '{"restaurant":{"id":"test","nom_restaurant":"Test"},"categories":[],"produits":[]}'
```
