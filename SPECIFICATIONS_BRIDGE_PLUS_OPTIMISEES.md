# 🚀 Spécifications Techniques Bridge+ - Version Optimisée

## 📋 Résumé Exécutif

**Objectif :** Synchronisation optimisée de restaurants Mafalia vers Bridge+ avec support des gros volumes (500+ produits)

**Performance cible :** 
- ✅ 43 produits → 8 secondes
- ✅ 500 produits → 18 secondes  
- ✅ 1000+ produits → 25 secondes

---

## 🔧 API Endpoints Requis

### **1. Synchronisation par lots (PRIORITÉ HAUTE)**

```typescript
POST /api/bridge/sync/products/batch
Content-Type: application/json
Authorization: Bearer mafalia-api-token-2025

{
  "products": [
    {
      "id": "uuid-string",
      "nom_produit": "Nom du produit",
      "prix": 2500,
      "description": "Description (max 200 chars)",
      "image": "https://example.com/thumbnail/image.jpg",
      "note": 4.5,
      "restaurant_id": "restaurant-uuid",
      "categorie_id": "category-uuid",
      "accompagnants": ["Accompagnant 1", "Accompagnant 2"]
    }
  ],
  "batchId": "batch-001",
  "totalBatches": 20,
  "currentBatch": 1,
  "restaurantId": "restaurant-uuid"
}

// Réponse attendue
{
  "success": true,
  "message": "Lot traité avec succès",
  "data": {
    "produits_mapping": {
      "mafalia-product-id": "bridge-product-id"
    },
    "batchId": "batch-001",
    "processedCount": 25
  }
}
```

### **2. Synchronisation restaurant et catégories**

```typescript
POST /api/bridge/sync/restaurant
Content-Type: application/json
Authorization: Bearer mafalia-api-token-2025

{
  "restaurant": {
    "id": "restaurant-uuid",
    "nom_restaurant": "Nom du Restaurant",
    "statut": "ouvert",
    "image": "https://example.com/logo.jpg"
  },
  "categories": [
    {
      "id": "category-id",
      "nom_categorie": "Nom de la catégorie"
    }
  ]
}

// Réponse attendue
{
  "success": true,
  "message": "Restaurant et catégories synchronisés",
  "data": {
    "restaurant_id": "bridge-restaurant-id",
    "categories_mapping": {
      "mafalia-category-id": "bridge-category-id"
    },
    "produits_mapping": {}
  }
}
```

### **3. Statut de synchronisation (OPTIONNEL)**

```typescript
GET /api/bridge/sync/status/{restaurantId}
Authorization: Bearer mafalia-api-token-2025

// Réponse attendue
{
  "success": true,
  "data": {
    "restaurantId": "restaurant-uuid",
    "isComplete": true,
    "processedBatches": 20,
    "totalBatches": 20,
    "lastBatchTime": "2025-01-27T10:30:00Z",
    "totalProducts": 500
  }
}
```

---

## 📊 Configuration des Lots

### **Taille de lot adaptative :**

| Volume de produits | Taille de lot | Délai entre lots | Timeout |
|-------------------|---------------|------------------|---------|
| ≤ 50 produits | 10 produits | 1000ms | 60s |
| 51-200 produits | 20 produits | 800ms | 90s |
| 201-500 produits | 25 produits | 600ms | 120s |
| 500+ produits | 30 produits | 500ms | 180s |

### **Exemple pour 500 produits :**
- ✅ **20 lots** de 25 produits
- ✅ **Délai** : 600ms entre les lots
- ✅ **Timeout** : 2 minutes
- ✅ **Temps estimé** : ~18 secondes

---

## 🗄️ Structure de Base de Données

### **Table `restaurants`**
```sql
CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  nom_restaurant text NOT NULL,
  statut text NOT NULL CHECK (statut IN ('ouvert', 'ferme')),
  image text
);
```

### **Table `categories`**
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  nom_categorie text NOT NULL
);
```

### **Table `produits`**
```sql
CREATE TABLE produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  nom_produit text NOT NULL,
  prix numeric NOT NULL,
  description text,
  image text,
  note numeric,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  categorie_id uuid REFERENCES categories(id),
  accompagnants jsonb DEFAULT '[]'::jsonb
);
```

### **Index de performance (CRITIQUE)**
```sql
-- Index pour les performances
CREATE INDEX CONCURRENTLY idx_produits_restaurant_id ON produits(restaurant_id);
CREATE INDEX CONCURRENTLY idx_produits_categorie_id ON produits(categorie_id);
CREATE INDEX CONCURRENTLY idx_restaurants_statut ON restaurants(statut);

-- Index composite pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY idx_produits_restaurant_categorie ON produits(restaurant_id, categorie_id);
```

---

## 🔄 Gestion des Erreurs

### **Codes d'erreur standardisés :**

```typescript
// Codes d'erreur à implémenter
enum BridgePlusErrorCodes {
  INVALID_TOKEN = 'INVALID_TOKEN',
  RESTAURANT_NOT_FOUND = 'RESTAURANT_NOT_FOUND',
  BATCH_TOO_LARGE = 'BATCH_TOO_LARGE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// Format de réponse d'erreur
{
  "success": false,
  "error": {
    "code": "BATCH_TOO_LARGE",
    "message": "Le lot contient trop de produits (max: 30)",
    "details": {
      "batchSize": 35,
      "maxAllowed": 30
    }
  }
}
```

### **Retry et backoff :**
- ✅ **5 tentatives** maximum
- ✅ **Backoff exponentiel** : 2s, 4s, 8s, 16s, 32s
- ✅ **Timeout** : 2 minutes pour les gros volumes

---

## 🚀 Optimisations de Performance

### **1. Compression des données**
```typescript
// Headers recommandés
Content-Encoding: gzip
Content-Type: application/json
```

### **2. Traitement asynchrone (pour 1000+ produits)**
```typescript
POST /api/bridge/sync/async
{
  "restaurant": Restaurant,
  "categories": Category[],
  "products": Product[],
  "callbackUrl": "https://mafalia.com/api/bridge/callback"
}

// Réponse immédiate
{
  "success": true,
  "jobId": "job-uuid-123",
  "estimatedTime": 25, // secondes
  "statusUrl": "/api/bridge/sync/status/job-uuid-123"
}
```

### **3. Cache Redis (RECOMMANDÉ)**
```typescript
// Cache des restaurants
redis.setex(`restaurant:${restaurantId}`, 3600, restaurantData);

// Cache des catégories
redis.setex('categories:global', 1800, categoriesData);

// Cache des mappings
redis.setex(`mapping:${restaurantId}`, 7200, mappingsData);
```

---

## 📋 Validation des Données

### **Contraintes de validation :**

```typescript
// Validation des produits
interface ProductValidation {
  nom_produit: {
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'àâäéèêëïîôöùûüÿçñ]+$/i
  },
  prix: {
    required: true,
    min: 0,
    max: 1000000,
    type: 'number'
  },
  description: {
    required: false,
    maxLength: 200 // Tronquée côté Mafalia
  },
  image: {
    required: false,
    format: 'url',
    maxLength: 500
  },
  note: {
    required: false,
    min: 0,
    max: 5,
    type: 'number'
  }
}
```

### **Validation des lots :**
- ✅ **Taille maximale** : 30 produits par lot
- ✅ **Timeout** : 2 minutes par lot
- ✅ **Validation** : Tous les produits du lot doivent être valides

---

## 🔐 Sécurité et Authentification

### **Token d'authentification :**
```typescript
// Header requis
Authorization: Bearer mafalia-api-token-2025

// Validation du token
- Vérifier la validité du token
- Vérifier les permissions (lecture/écriture)
- Logger toutes les requêtes
```

### **Rate limiting :**
```typescript
// Limites recommandées
- 100 requêtes/minute par token
- 10 lots/minute par restaurant
- 1000 produits/minute par restaurant
```

---

## 📊 Monitoring et Logs

### **Métriques à tracker :**
```typescript
interface SyncMetrics {
  restaurantId: string;
  totalProducts: number;
  totalBatches: number;
  processingTime: number; // en secondes
  successRate: number; // pourcentage
  errorCount: number;
  lastSyncTime: string;
}
```

### **Logs requis :**
```typescript
// Format de log
{
  "timestamp": "2025-01-27T10:30:00Z",
  "level": "INFO",
  "service": "bridge-plus-sync",
  "restaurantId": "restaurant-uuid",
  "batchId": "batch-001",
  "action": "sync_batch",
  "productsCount": 25,
  "processingTime": 1.2,
  "status": "success"
}
```

---

## 🧪 Tests de Validation

### **Tests de performance requis :**

```typescript
// Tests à implémenter côté Bridge+
describe('Bridge+ Sync Performance', () => {
  test('43 produits - 5 lots de 10', async () => {
    // Devrait prendre < 8 secondes
  });
  
  test('500 produits - 20 lots de 25', async () => {
    // Devrait prendre < 18 secondes
  });
  
  test('1000 produits - 34 lots de 30', async () => {
    // Devrait prendre < 25 secondes
  });
});
```

### **Tests de charge :**
- ✅ **10 restaurants** simultanés
- ✅ **500 produits** par restaurant
- ✅ **Temps de réponse** < 2 secondes par lot
- ✅ **Taux de succès** > 95%

---

## 📅 Plan d'Implémentation

### **Phase 1 : API de base (1 semaine)**
- ✅ Endpoint `/api/bridge/sync/restaurant`
- ✅ Endpoint `/api/bridge/sync/products/batch`
- ✅ Validation des données
- ✅ Gestion d'erreurs basique

### **Phase 2 : Optimisations (1 semaine)**
- ✅ Index de base de données
- ✅ Compression gzip
- ✅ Cache Redis
- ✅ Monitoring basique

### **Phase 3 : Performance (1 semaine)**
- ✅ Traitement asynchrone
- ✅ Rate limiting
- ✅ Tests de charge
- ✅ Monitoring avancé

---

## 🎯 Critères de Succès

### **Performance :**
- ✅ **43 produits** : < 8 secondes
- ✅ **500 produits** : < 18 secondes
- ✅ **1000+ produits** : < 25 secondes
- ✅ **Taux de succès** : > 95%

### **Fiabilité :**
- ✅ **Retry automatique** en cas d'erreur
- ✅ **Gestion des timeouts** robuste
- ✅ **Logs détaillés** pour le debugging
- ✅ **Monitoring** en temps réel

### **Scalabilité :**
- ✅ **Support** de 1000+ produits
- ✅ **Traitement** de 10 restaurants simultanés
- ✅ **Cache** intelligent
- ✅ **Base de données** optimisée

---

## 📞 Support et Communication

### **Points de contact :**
- **Technique** : [email-technique-bridge-plus]
- **Urgences** : [telephone-urgence]
- **Documentation** : [url-documentation]

### **Communication :**
- **Status page** : [url-status-page]
- **Incidents** : [url-incidents]
- **Updates** : [url-updates]

---

## 🎉 Résumé

**Bridge+ doit implémenter :**

1. ✅ **API par lots** avec taille adaptative
2. ✅ **Base de données** optimisée avec index
3. ✅ **Gestion d'erreurs** robuste avec retry
4. ✅ **Cache Redis** pour les performances
5. ✅ **Monitoring** et logs détaillés
6. ✅ **Tests de performance** pour validation

**Avec ces spécifications, la synchronisation de 500 produits se fera en ~18 secondes au lieu de timeout !** 🚀

---

**📝 Prochaines étapes :**
1. Partager ces spécifications avec l'équipe Bridge+
2. Valider l'implémentation des endpoints
3. Tester la synchronisation avec 500 produits
4. Optimiser selon les résultats
