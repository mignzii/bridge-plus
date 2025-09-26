# 📋 CONTRAT D'INTERFACE - Bridge+ ↔ Mafalia

## 🎯 Vue d'ensemble

**Document contractuel** définissant l'interface de synchronisation entre **Mafalia** (système POS) et **Bridge+** (plateforme de livraison).

**Version :** 1.0  
**Date :** 27 Janvier 2025  
**Statut :** ACTIF

---

## 🔐 Authentification

### **Token d'accès**
```http
Authorization: Bearer mafalia-api-token-2025
```

**Responsabilités :**
- ✅ **Bridge+** : Valider le token sur toutes les requêtes
- ✅ **Mafalia** : Inclure le token dans tous les headers

---

## 📡 API Endpoints

### **1. Synchronisation Restaurant & Catégories**

#### **Endpoint :** `POST /api/bridge/sync/restaurant`

**Responsabilité Bridge+ :** Créer/mettre à jour restaurant et catégories

**Requête Mafalia :**
```typescript
interface RestaurantSyncRequest {
  restaurant: {
    id: string;                    // ID Mafalia (requis)
    nom_restaurant: string;        // Max 100 chars (requis)
    statut: 'ouvert' | 'ferme';    // Enum strict (requis)
    image?: string;                // URL valide, max 500 chars (optionnel)
  };
  categories: Array<{
    id: string;                    // ID Mafalia (requis)
    nom_categorie: string;         // Max 50 chars (requis)
  }>;
}
```

**Réponse Bridge+ :**
```typescript
interface RestaurantSyncResponse {
  success: boolean;
  message: string;
  data: {
    restaurant_id: string;         // ID Bridge+ généré
    categories_mapping: Record<string, string>; // mafalia_id → bridge_id
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Codes d'erreur :**
- `INVALID_TOKEN` : Token d'authentification invalide
- `VALIDATION_ERROR` : Données de requête invalides
- `DATABASE_ERROR` : Erreur de base de données

---

### **2. Synchronisation Produits par Lots**

#### **Endpoint :** `POST /api/bridge/sync/products/batch`

**Responsabilité Bridge+ :** Traiter un lot de produits (max 30 produits)

**Requête Mafalia :**
```typescript
interface ProductsBatchRequest {
  products: Array<{
    id: string;                    // ID Mafalia (requis)
    nom_produit: string;           // Max 100 chars (requis)
    prix: number;                  // 0-1000000 (requis)
    description?: string;          // Max 200 chars (optionnel)
    image?: string;                // URL valide, max 500 chars (optionnel)
    note?: number;                 // 0-5 (optionnel)
    restaurant_id: string;         // ID Bridge+ du restaurant (requis)
    categorie_id: string;          // ID Bridge+ de la catégorie (requis)
    accompagnants?: string[];      // Array de strings (optionnel)
  }>;
  batchId: string;                 // ID unique du lot (requis)
  totalBatches: number;            // Nombre total de lots (requis)
  currentBatch: number;            // Numéro du lot actuel (requis)
  restaurantId: string;            // ID Bridge+ du restaurant (requis)
}
```

**Réponse Bridge+ :**
```typescript
interface ProductsBatchResponse {
  success: boolean;
  message: string;
  data: {
    produits_mapping: Record<string, string>; // mafalia_id → bridge_id
    batchId: string;
    processedCount: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**Codes d'erreur :**
- `BATCH_TOO_LARGE` : Lot contient plus de 30 produits
- `RESTAURANT_NOT_FOUND` : Restaurant ID introuvable
- `CATEGORY_NOT_FOUND` : Catégorie ID introuvable
- `VALIDATION_ERROR` : Données de produit invalides

---

### **3. Statut de Synchronisation**

#### **Endpoint :** `GET /api/bridge/sync/status/{restaurantId}`

**Responsabilité Bridge+ :** Retourner le statut de synchronisation

**Réponse Bridge+ :**
```typescript
interface SyncStatusResponse {
  success: boolean;
  data: {
    restaurantId: string;
    isComplete: boolean;
    processedBatches: number;
    totalBatches: number;
    lastBatchTime?: string;        // ISO 8601
    totalProducts: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 📊 Configuration des Lots

### **Responsabilité Mafalia :** Optimiser la taille des lots

| Volume de produits | Taille de lot | Délai entre lots | Timeout |
|-------------------|---------------|------------------|---------|
| ≤ 50 produits     | 10 produits   | 1000ms          | 60s     |
| 51-200 produits   | 20 produits   | 800ms           | 90s     |
| 201-500 produits  | 25 produits   | 600ms           | 120s    |
| 500+ produits     | 30 produits   | 500ms           | 180s    |

**Exemple 500 produits :**
- ✅ **20 lots** de 25 produits
- ✅ **Délai** : 600ms entre les lots
- ✅ **Timeout** : 2 minutes par lot
- ✅ **Temps estimé** : ~18 secondes

---

## 🔄 Gestion des Erreurs

### **Responsabilité Mafalia :** Implémenter retry automatique

**Stratégie de retry :**
- ✅ **5 tentatives** maximum
- ✅ **Backoff exponentiel** : 2s, 4s, 8s, 16s, 32s
- ✅ **Timeout** : 2 minutes pour gros volumes

**Codes d'erreur à gérer :**
```typescript
enum BridgePlusErrorCodes {
  INVALID_TOKEN = 'INVALID_TOKEN',
  RESTAURANT_NOT_FOUND = 'RESTAURANT_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  BATCH_TOO_LARGE = 'BATCH_TOO_LARGE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}
```

---

## 📋 Validation des Données

### **Responsabilité Mafalia :** Valider les données avant envoi

**Contraintes produits :**
```typescript
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
    maxLength: 200
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

**Contraintes lots :**
- ✅ **Taille maximale** : 30 produits par lot
- ✅ **Timeout** : 2 minutes par lot
- ✅ **Validation** : Tous les produits du lot doivent être valides

---

## 🚀 Performance

### **Objectifs de performance :**

| Volume | Temps cible | Taille de lot | Délai |
|--------|-------------|---------------|-------|
| 43 produits | < 8 secondes | 10 produits | 1000ms |
| 500 produits | < 18 secondes | 25 produits | 600ms |
| 1000+ produits | < 25 secondes | 30 produits | 500ms |

### **Responsabilités :**
- ✅ **Bridge+** : Maintenir temps de réponse < 2s par lot
- ✅ **Mafalia** : Respecter les délais entre lots
- ✅ **Bridge+** : Taux de succès > 95%
- ✅ **Mafalia** : Gestion des timeouts et retry

---

## 🔐 Sécurité

### **Rate Limiting (Bridge+)**
- ✅ **100 requêtes/minute** par token
- ✅ **10 lots/minute** par restaurant
- ✅ **1000 produits/minute** par restaurant

### **Headers requis (Mafalia)**
```http
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json
User-Agent: Mafalia-POS/1.0
```

---

## 📊 Monitoring

### **Responsabilité Bridge+ :** Fournir métriques

**Métriques à tracker :**
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

### **Responsabilité Mafalia :** Logger les synchronisations

**Format de log requis :**
```typescript
{
  "timestamp": "2025-01-27T10:30:00Z",
  "level": "INFO",
  "service": "mafalia-bridge-sync",
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

**Bridge+ doit valider :**
```typescript
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

**Mafalia doit valider :**
- ✅ **Tests de charge** : 10 restaurants simultanés
- ✅ **Tests de retry** : Gestion des erreurs
- ✅ **Tests de validation** : Données invalides

---

## 📅 Plan d'Implémentation

### **Phase 1 : API de base (Semaine 1)**
- ✅ **Bridge+** : Endpoints `/sync/restaurant` et `/sync/products/batch`
- ✅ **Bridge+** : Validation des données
- ✅ **Bridge+** : Gestion d'erreurs basique
- ✅ **Mafalia** : Client de synchronisation basique

### **Phase 2 : Optimisations (Semaine 2)**
- ✅ **Bridge+** : Index de base de données
- ✅ **Bridge+** : Compression gzip
- ✅ **Mafalia** : Optimisation des lots
- ✅ **Mafalia** : Retry automatique

### **Phase 3 : Performance (Semaine 3)**
- ✅ **Bridge+** : Monitoring avancé
- ✅ **Mafalia** : Tests de charge
- ✅ **Bridge+** : Tests de performance
- ✅ **Mafalia** : Tests de validation

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
- ✅ **Base de données** optimisée

---

## 📞 Support et Communication

### **Points de contact :**
- **Technique Bridge+** : [email-technique-bridge-plus]
- **Technique Mafalia** : [email-technique-mafalia]
- **Urgences** : [telephone-urgence]

### **Communication :**
- **Status page** : [url-status-page]
- **Incidents** : [url-incidents]
- **Updates** : [url-updates]

---

## 📝 Résumé des Responsabilités

### **Bridge+ doit implémenter :**
1. ✅ **API par lots** avec taille adaptative
2. ✅ **Base de données** optimisée avec index
3. ✅ **Gestion d'erreurs** robuste
4. ✅ **Monitoring** et logs détaillés
5. ✅ **Tests de performance** pour validation

### **Mafalia doit implémenter :**
1. ✅ **Client de synchronisation** avec retry
2. ✅ **Optimisation des lots** selon le volume
3. ✅ **Validation des données** avant envoi
4. ✅ **Gestion des timeouts** et erreurs
5. ✅ **Tests de charge** et validation

---

## 🚨 URGENT

**Ce contrat doit être implémenté dans les 2 semaines pour supporter la synchronisation de 500+ produits sans timeout !**

**Performance actuelle :** Timeout après 30s  
**Performance cible :** 18s pour 500 produits

**Action requise :** Implémentation immédiate des API par lots avec configuration adaptative.

---

**📋 Signatures :**

**Bridge+** : _________________ Date : _________

**Mafalia** : _________________ Date : _________

---

*Document contractuel - Version 1.0 - 27 Janvier 2025*
