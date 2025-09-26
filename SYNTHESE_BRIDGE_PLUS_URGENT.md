# 🚨 SYNTHÈSE URGENTE - Bridge+ Integration

## 🎯 Objectif
Synchronisation optimisée de restaurants Mafalia vers Bridge+ avec support des gros volumes (500+ produits)

## ⚡ Performance Cible
- **43 produits** → 8 secondes
- **500 produits** → 18 secondes  
- **1000+ produits** → 25 secondes

---

## 🔧 API Endpoints CRITIQUES

### **1. Synchronisation par lots (PRIORITÉ 1)**
```http
POST /api/bridge/sync/products/batch
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json

{
  "products": [Product[]],
  "batchId": "batch-001",
  "totalBatches": 20,
  "currentBatch": 1,
  "restaurantId": "restaurant-uuid"
}
```

### **2. Synchronisation restaurant (PRIORITÉ 2)**
```http
POST /api/bridge/sync/restaurant
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json

{
  "restaurant": Restaurant,
  "categories": Category[]
}
```

---

## 📊 Configuration des Lots

| Volume | Taille de lot | Délai | Timeout |
|--------|---------------|-------|---------|
| ≤ 50 produits | 10 | 1000ms | 60s |
| 51-200 produits | 20 | 800ms | 90s |
| 201-500 produits | 25 | 600ms | 120s |
| 500+ produits | 30 | 500ms | 180s |

**Exemple 500 produits :** 20 lots de 25 produits, 600ms entre lots, timeout 2min

---

## 🗄️ Base de Données

### **Tables requises :**
```sql
-- restaurants
CREATE TABLE restaurants (
  id uuid PRIMARY KEY,
  nom_restaurant text NOT NULL,
  statut text NOT NULL,
  image text
);

-- categories  
CREATE TABLE categories (
  id uuid PRIMARY KEY,
  nom_categorie text NOT NULL
);

-- produits
CREATE TABLE produits (
  id uuid PRIMARY KEY,
  nom_produit text NOT NULL,
  prix numeric NOT NULL,
  description text,
  image text,
  note numeric,
  restaurant_id uuid REFERENCES restaurants(id),
  categorie_id uuid REFERENCES categories(id),
  accompagnants jsonb
);
```

### **Index CRITIQUES :**
```sql
CREATE INDEX idx_produits_restaurant_id ON produits(restaurant_id);
CREATE INDEX idx_produits_categorie_id ON produits(categorie_id);
```

---

## 🔄 Gestion d'Erreurs

### **Retry automatique :**
- **5 tentatives** maximum
- **Backoff exponentiel** : 2s, 4s, 8s, 16s, 32s
- **Timeout** : 2 minutes pour gros volumes

### **Codes d'erreur :**
```json
{
  "success": false,
  "error": {
    "code": "BATCH_TOO_LARGE",
    "message": "Le lot contient trop de produits (max: 30)"
  }
}
```

---

## 🚀 Optimisations RECOMMANDÉES

### **1. Cache Redis**
```typescript
// Cache restaurants (1h)
redis.setex(`restaurant:${id}`, 3600, data);

// Cache catégories (30min)  
redis.setex('categories:global', 1800, data);
```
    
### **2. Compression**
```http
Content-Encoding: gzip
```

### **3. Traitement asynchrone (1000+ produits)**
```http
POST /api/bridge/sync/async
{
  "restaurant": Restaurant,
  "products": Product[],
  "callbackUrl": "https://mafalia.com/api/bridge/callback"
}
```

---

## 📋 Validation

### **Contraintes produits :**
- `nom_produit` : max 100 chars, requis
- `prix` : 0-1000000, requis
- `description` : max 200 chars (tronquée côté Mafalia)
- `image` : URL valide, max 500 chars
- `note` : 0-5, optionnel

### **Contraintes lots :**
- **Max 30 produits** par lot
- **Timeout 2 minutes** par lot
- **Validation** de tous les produits

---

## 🧪 Tests de Validation

### **Tests de performance :**
```typescript
// 43 produits - 5 lots de 10 → < 8s
// 500 produits - 20 lots de 25 → < 18s  
// 1000 produits - 34 lots de 30 → < 25s
```

### **Tests de charge :**
- **10 restaurants** simultanés
- **500 produits** par restaurant
- **Temps de réponse** < 2s par lot
- **Taux de succès** > 95%

---

## 📅 Plan d'Implémentation

### **Semaine 1 : API de base**
- ✅ Endpoints `/sync/restaurant` et `/sync/products/batch`
- ✅ Validation des données
- ✅ Gestion d'erreurs

### **Semaine 2 : Optimisations**
- ✅ Index de base de données
- ✅ Cache Redis
- ✅ Compression gzip

### **Semaine 3 : Performance**
- ✅ Traitement asynchrone
- ✅ Tests de charge
- ✅ Monitoring

---

## 🎯 Critères de Succès

- ✅ **500 produits** synchronisés en < 18 secondes
- ✅ **Taux de succès** > 95%
- ✅ **Retry automatique** en cas d'erreur
- ✅ **Monitoring** en temps réel

---

## 📞 Contact

**Technique :** [email-technique-bridge-plus]
**Urgences :** [telephone-urgence]

---

## 🚨 URGENT

**Bridge+ doit implémenter ces endpoints dans les 2 semaines pour supporter la synchronisation de 500+ produits sans timeout !**

**Performance actuelle :** Timeout après 30s
**Performance cible :** 18s pour 500 produits

**Action requise :** Implémentation immédiate des API par lots avec configuration adaptative.
