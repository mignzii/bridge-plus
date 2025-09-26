# 🔗 API Bridge+ - Intégration Mafalia

## 📋 Vue d'ensemble

Cette API permet la synchronisation automatique des données entre **Mafalia** (système POS) et **Bridge+** (plateforme de livraison).

## 🔐 Authentification

Toutes les requêtes doivent inclure un header d'authentification :

```
Authorization: Bearer YOUR_API_TOKEN
```

## 📡 Endpoints disponibles

### 1. Synchronisation complète d'un restaurant

**POST** `/api/bridge/sync/restaurant`

Synchronise toutes les données d'un restaurant (informations, catégories, produits) en une seule requête.

**Body :**
```json
{
  "restaurant": {
    "id": "mafalia_restaurant_123",
    "nom_restaurant": "Restaurant Example",
    "statut": "ouvert",
    "image": "https://example.com/image.jpg"
  },
  "categories": [
    {
      "id": "cat_1",
      "nom_categorie": "Fast Food"
    }
  ],
  "produits": [
    {
      "id": "prod_1",
      "nom_produit": "Burger Deluxe",
      "prix": 5000,
      "description": "Un délicieux burger",
      "image": "https://example.com/burger.jpg",
      "note": 4.5,
      "categorie_id": "cat_1",
      "accompagnants": ["Frites", "Salade"]
    }
  ]
}
```

**Response :**
```json
{
  "success": true,
  "message": "Synchronisation réussie",
  "data": {
    "restaurant_id": "uuid-bridge-restaurant",
    "categories_mapping": {
      "cat_1": "uuid-bridge-category"
    },
    "produits_mapping": {
      "prod_1": "uuid-bridge-product"
    }
  }
}
```

### 2. Synchronisation des catégories

**POST** `/api/bridge/sync/categories`

**Body :**
```json
[
  {
    "id": "cat_1",
    "nom_categorie": "Fast Food"
  },
  {
    "id": "cat_2", 
    "nom_categorie": "Pizza"
  }
]
```

### 3. Synchronisation des produits

**POST** `/api/bridge/sync/products`

**Body :**
```json
[
  {
    "id": "prod_1",
    "nom_produit": "Burger Deluxe",
    "prix": 5000,
    "description": "Un délicieux burger",
    "image": "https://example.com/burger.jpg",
    "note": 4.5,
    "restaurant_id": "mafalia_restaurant_123",
    "categorie_id": "cat_1",
    "accompagnants": ["Frites", "Salade"]
  }
]
```

### 4. Statut de synchronisation

**GET** `/api/bridge/sync/status/{restaurantId}`

**Response :**
```json
{
  "success": true,
  "message": "Statut de synchronisation récupéré",
  "data": {
    "restaurant_id": "uuid-bridge-restaurant",
    "mafalia_restaurant_id": "mafalia_restaurant_123",
    "last_sync": "2025-01-27T10:30:00Z",
    "categories_count": 5,
    "produits_count": 25,
    "status": "active"
  }
}
```

## 🔄 Logique de synchronisation

### Restaurants
- Si un restaurant avec le même `mafalia_restaurant_id` existe → **Mise à jour**
- Sinon → **Création** d'un nouveau restaurant

### Catégories
- Si une catégorie avec le même `mafalia_category_id` existe → **Mise à jour**
- Sinon → **Création** d'une nouvelle catégorie

### Produits
- Si un produit avec le même `mafalia_product_id` existe → **Mise à jour**
- Sinon → **Création** d'un nouveau produit
- Les produits sont automatiquement liés au restaurant et à la catégorie

## ⚠️ Gestion des erreurs

### Codes d'erreur HTTP
- `400` : Données invalides
- `401` : Authentification requise
- `404` : Ressource non trouvée
- `500` : Erreur serveur

### Format des erreurs
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques"
}
```

## 🧪 Tests

### Exemple de test avec curl

```bash
# Synchronisation complète
curl -X POST http://localhost:3000/api/bridge/sync/restaurant \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant": {
      "id": "test_restaurant_1",
      "nom_restaurant": "Test Restaurant",
      "statut": "ouvert"
    },
    "categories": [],
    "produits": []
  }'

# Vérifier le statut
curl -X GET http://localhost:3000/api/bridge/sync/status/test_restaurant_1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Monitoring

- Tous les appels API sont loggés
- Les erreurs sont enregistrées avec stack trace
- Métriques de performance disponibles

## 🔧 Configuration

Assurez-vous que les variables d'environnement suivantes sont configurées :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
