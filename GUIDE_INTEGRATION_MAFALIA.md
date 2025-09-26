# 📋 Guide d'Intégration Mafalia → Bridge+

## 🎯 Vue d'ensemble

Ce document fournit toutes les informations nécessaires pour intégrer votre système POS **Mafalia** avec la plateforme de livraison **Bridge+**. Cette intégration permettra la synchronisation automatique des données de restaurant (informations, catégories, produits) entre les deux systèmes.

---

## 📊 Architecture de l'intégration

```mermaid
graph TD
    A[Système Mafalia POS] -->|1. Données restaurant| B[Bridge+ API]
    B -->|2. Validation & Auth| C[Base de données Bridge+]
    C -->|3. Création/Mise à jour| D[Tables synchronisées]
    D -->|4. Mapping des IDs| E[Response à Mafalia]
    E -->|5. Sauvegarde mapping| A
    
    F[Client Bridge+] -->|Commande| G[Produits synchronisés]
    G -->|Livraison| H[Restaurant Mafalia]
```

---

## 🔧 Configuration requise

### 1. Informations de connexion Bridge+

**URL de base :** `https://bridge-plus.com` (ou votre domaine de production)

**Token d'authentification :** `mafalia-api-token-2025`

### 2. Headers requis pour toutes les requêtes

```http
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json
```

---

## 📡 Endpoints disponibles

### 1. Synchronisation complète d'un restaurant

**Endpoint :** `POST /api/bridge/sync/restaurant`

**Description :** Synchronise toutes les données d'un restaurant (informations, catégories, produits) en une seule requête.

**Avantages :**
- ✅ Opération atomique (tout ou rien)
- ✅ Mapping automatique des IDs
- ✅ Gestion des relations entre entités

**Exemple de requête :**

```http
POST https://bridge-plus.com/api/bridge/sync/restaurant
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json

{
  "restaurant": {
    "id": "mafalia_restaurant_001",
    "nom_restaurant": "Restaurant Le Gourmet",
    "statut": "ouvert",
    "image": "https://example.com/restaurant-image.jpg"
  },
  "categories": [
    {
      "id": "mafalia_cat_001",
      "nom_categorie": "Fast Food"
    },
    {
      "id": "mafalia_cat_002", 
      "nom_categorie": "Pizza"
    }
  ],
  "produits": [
    {
      "id": "mafalia_prod_001",
      "nom_produit": "Burger Deluxe",
      "prix": 5500,
      "description": "Un délicieux burger avec frites",
      "image": "https://example.com/burger.jpg",
      "note": 4.8,
      "categorie_id": "mafalia_cat_001",
      "accompagnants": ["Frites", "Salade", "Sauce"]
    },
    {
      "id": "mafalia_prod_002",
      "nom_produit": "Pizza Margherita",
      "prix": 4500,
      "description": "Pizza classique tomate-mozzarella",
      "image": "https://example.com/pizza.jpg",
      "note": 4.5,
      "categorie_id": "mafalia_cat_002",
      "accompagnants": ["Fromage", "Tomate", "Basilic"]
    }
  ]
}
```

**Réponse de succès :**

```json
{
  "success": true,
  "message": "Synchronisation réussie",
  "data": {
    "restaurant_id": "uuid-bridge-restaurant-123",
    "categories_mapping": {
      "mafalia_cat_001": "uuid-bridge-category-456",
      "mafalia_cat_002": "uuid-bridge-category-789"
    },
    "produits_mapping": {
      "mafalia_prod_001": "uuid-bridge-product-101",
      "mafalia_prod_002": "uuid-bridge-product-102"
    }
  }
}
```

### 2. Synchronisation des catégories uniquement

**Endpoint :** `POST /api/bridge/sync/categories`

**Description :** Synchronise uniquement les catégories de produits.

**Exemple de requête :**

```http
POST https://bridge-plus.com/api/bridge/sync/categories
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json

[
  {
    "id": "mafalia_cat_003",
    "nom_categorie": "Boissons"
  },
  {
    "id": "mafalia_cat_004",
    "nom_categorie": "Desserts"
  }
]
```

### 3. Synchronisation des produits uniquement

**Endpoint :** `POST /api/bridge/sync/products`

**Description :** Synchronise uniquement les produits.

**Exemple de requête :**

```http
POST https://bridge-plus.com/api/bridge/sync/products
Authorization: Bearer mafalia-api-token-2025
Content-Type: application/json

[
  {
    "id": "mafalia_prod_003",
    "nom_produit": "Coca Cola",
    "prix": 1000,
    "description": "Boisson rafraîchissante",
    "restaurant_id": "mafalia_restaurant_001",
    "categorie_id": "mafalia_cat_003",
    "accompagnants": ["Glaçons"]
  }
]
```

### 4. Vérification du statut de synchronisation

**Endpoint :** `GET /api/bridge/sync/status/{restaurantId}`

**Description :** Récupère le statut de synchronisation d'un restaurant.

**Exemple de requête :**

```http
GET https://bridge-plus.com/api/bridge/sync/status/mafalia_restaurant_001
Authorization: Bearer mafalia-api-token-2025
```

**Réponse :**

```json
{
  "success": true,
  "message": "Statut de synchronisation récupéré",
  "data": {
    "restaurant_id": "uuid-bridge-restaurant-123",
    "mafalia_restaurant_id": "mafalia_restaurant_001",
    "last_sync": "2025-01-27T10:30:00Z",
    "categories_count": 4,
    "produits_count": 15,
    "status": "active"
  }
}
```

---

## 🔄 Logique de synchronisation

### Comportement des endpoints

#### Restaurants
- **Si restaurant existe** (même `mafalia_restaurant_id`) → **Mise à jour** des informations
- **Si restaurant n'existe pas** → **Création** d'un nouveau restaurant
- **Retour** : ID Bridge+ du restaurant

#### Catégories
- **Si catégorie existe** (même `mafalia_category_id`) → **Mise à jour** du nom
- **Si catégorie n'existe pas** → **Création** d'une nouvelle catégorie
- **Retour** : Mapping `mafalia_id` → `bridge_id`

#### Produits
- **Si produit existe** (même `mafalia_product_id`) → **Mise à jour** complète
- **Si produit n'existe pas** → **Création** d'un nouveau produit
- **Liaison automatique** avec restaurant et catégorie
- **Retour** : Mapping `mafalia_id` → `bridge_id`

### Gestion des relations

1. **Restaurant → Produits** : Les produits sont automatiquement liés au restaurant
2. **Catégorie → Produits** : Les produits sont liés à leur catégorie si elle existe
3. **Validation** : Si une catégorie n'existe pas, le produit est créé sans catégorie

---

## 💻 Implémentation côté Mafalia

### 1. Client HTTP simple (JavaScript/Node.js)

```javascript
class MafaliaBridgeClient {
  constructor(baseUrl, apiToken) {
    this.baseUrl = baseUrl;
    this.apiToken = apiToken;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Erreur API Bridge+:', error);
      throw error;
    }
  }

  // Synchronisation complète
  async syncRestaurant(restaurant, categories, produits) {
    return this.makeRequest('/api/bridge/sync/restaurant', 'POST', {
      restaurant,
      categories,
      produits
    });
  }

  // Synchronisation des catégories
  async syncCategories(categories) {
    return this.makeRequest('/api/bridge/sync/categories', 'POST', categories);
  }

  // Synchronisation des produits
  async syncProducts(produits) {
    return this.makeRequest('/api/bridge/sync/products', 'POST', produits);
  }

  // Vérifier le statut
  async getSyncStatus(restaurantId) {
    return this.makeRequest(`/api/bridge/sync/status/${restaurantId}`);
  }
}

// Utilisation
const client = new MafaliaBridgeClient(
  'https://bridge-plus.com',
  'mafalia-api-token-2025'
);

// Exemple d'utilisation
async function synchroniserRestaurant() {
  try {
    const result = await client.syncRestaurant(
      {
        id: 'mafalia_restaurant_001',
        nom_restaurant: 'Mon Restaurant',
        statut: 'ouvert'
      },
      [
        { id: 'cat_1', nom_categorie: 'Fast Food' }
      ],
      [
        {
          id: 'prod_1',
          nom_produit: 'Burger',
          prix: 5000,
          restaurant_id: 'mafalia_restaurant_001',
          categorie_id: 'cat_1'
        }
      ]
    );

    console.log('Synchronisation réussie:', result.data);
    
    // Sauvegarder le mapping des IDs
    await sauvegarderMapping(result.data);
    
  } catch (error) {
    console.error('Erreur de synchronisation:', error);
  }
}
```

### 2. Client PHP (pour systèmes PHP)

```php
<?php
class MafaliaBridgeClient {
    private $baseUrl;
    private $apiToken;
    
    public function __construct($baseUrl, $apiToken) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiToken = $apiToken;
    }
    
    private function makeRequest($endpoint, $method = 'GET', $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->apiToken,
            'Content-Type: application/json'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new Exception("Erreur HTTP $httpCode: $response");
        }
        
        return json_decode($response, true);
    }
    
    public function syncRestaurant($restaurant, $categories, $produits) {
        return $this->makeRequest('/api/bridge/sync/restaurant', 'POST', [
            'restaurant' => $restaurant,
            'categories' => $categories,
            'produits' => $produits
        ]);
    }
    
    public function syncCategories($categories) {
        return $this->makeRequest('/api/bridge/sync/categories', 'POST', $categories);
    }
    
    public function syncProducts($produits) {
        return $this->makeRequest('/api/bridge/sync/products', 'POST', $produits);
    }
    
    public function getSyncStatus($restaurantId) {
        return $this->makeRequest("/api/bridge/sync/status/$restaurantId");
    }
}

// Utilisation
$client = new MafaliaBridgeClient(
    'https://bridge-plus.com',
    'mafalia-api-token-2025'
);

try {
    $result = $client->syncRestaurant(
        [
            'id' => 'mafalia_restaurant_001',
            'nom_restaurant' => 'Mon Restaurant',
            'statut' => 'ouvert'
        ],
        [
            ['id' => 'cat_1', 'nom_categorie' => 'Fast Food']
        ],
        [
            [
                'id' => 'prod_1',
                'nom_produit' => 'Burger',
                'prix' => 5000,
                'restaurant_id' => 'mafalia_restaurant_001',
                'categorie_id' => 'cat_1'
            ]
        ]
    );
    
    echo "Synchronisation réussie!\n";
    print_r($result['data']);
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>
```

### 3. Client Python (pour systèmes Python)

```python
import requests
import json

class MafaliaBridgeClient:
    def __init__(self, base_url, api_token):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def make_request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers)
            else:
                response = requests.post(url, headers=self.headers, json=data)
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Erreur API Bridge+: {e}")
            raise
    
    def sync_restaurant(self, restaurant, categories, produits):
        return self.make_request('/api/bridge/sync/restaurant', 'POST', {
            'restaurant': restaurant,
            'categories': categories,
            'produits': produits
        })
    
    def sync_categories(self, categories):
        return self.make_request('/api/bridge/sync/categories', 'POST', categories)
    
    def sync_products(self, produits):
        return self.make_request('/api/bridge/sync/products', 'POST', produits)
    
    def get_sync_status(self, restaurant_id):
        return self.make_request(f'/api/bridge/sync/status/{restaurant_id}')

# Utilisation
client = MafaliaBridgeClient(
    'https://bridge-plus.com',
    'mafalia-api-token-2025'
)

try:
    result = client.sync_restaurant(
        {
            'id': 'mafalia_restaurant_001',
            'nom_restaurant': 'Mon Restaurant',
            'statut': 'ouvert'
        },
        [
            {'id': 'cat_1', 'nom_categorie': 'Fast Food'}
        ],
        [
            {
                'id': 'prod_1',
                'nom_produit': 'Burger',
                'prix': 5000,
                'restaurant_id': 'mafalia_restaurant_001',
                'categorie_id': 'cat_1'
            }
        ]
    )
    
    print("Synchronisation réussie!")
    print(json.dumps(result['data'], indent=2))
    
except Exception as e:
    print(f"Erreur: {e}")
```

---

## 🧪 Tests et validation

### 1. Test avec curl (ligne de commande)

```bash
# Test de synchronisation complète
curl -X POST https://bridge-plus.com/api/bridge/sync/restaurant \
  -H "Authorization: Bearer mafalia-api-token-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant": {
      "id": "test_restaurant_001",
      "nom_restaurant": "Restaurant Test",
      "statut": "ouvert"
    },
    "categories": [
      {
        "id": "test_cat_001",
        "nom_categorie": "Test Category"
      }
    ],
    "produits": [
      {
        "id": "test_prod_001",
        "nom_produit": "Produit Test",
        "prix": 1000,
        "restaurant_id": "test_restaurant_001",
        "categorie_id": "test_cat_001"
      }
    ]
  }'

# Test du statut
curl -X GET https://bridge-plus.com/api/bridge/sync/status/test_restaurant_001 \
  -H "Authorization: Bearer mafalia-api-token-2025"
```

### 2. Test avec Postman

1. **Créer une nouvelle requête POST**
2. **URL :** `https://bridge-plus.com/api/bridge/sync/restaurant`
3. **Headers :**
   - `Authorization: Bearer mafalia-api-token-2025`
   - `Content-Type: application/json`
4. **Body (JSON) :** Utiliser l'exemple de requête ci-dessus

### 3. Validation des réponses

Vérifiez que la réponse contient :
- ✅ `"success": true`
- ✅ `"data"` avec les mappings d'IDs
- ✅ Pas d'erreurs dans `"error"`

---

## ⚠️ Gestion des erreurs

### Codes d'erreur HTTP

| Code | Signification | Action recommandée |
|------|---------------|-------------------|
| `400` | Données invalides | Vérifier le format JSON et les champs requis |
| `401` | Authentification requise | Vérifier le token d'authentification |
| `404` | Ressource non trouvée | Vérifier l'URL de l'endpoint |
| `500` | Erreur serveur | Contacter le support Bridge+ |

### Format des erreurs

```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques"
}
```

### Exemples d'erreurs courantes

#### 1. Token invalide
```json
{
  "success": false,
  "message": "Authentification requise",
  "error": "Token manquant ou invalide"
}
```
**Solution :** Vérifier que le token `mafalia-api-token-2025` est correctement utilisé.

#### 2. Données manquantes
```json
{
  "success": false,
  "message": "Données de restaurant invalides",
  "error": "Restaurant ID et nom requis"
}
```
**Solution :** S'assurer que tous les champs requis sont fournis.

#### 3. Restaurant non trouvé
```json
{
  "success": false,
  "message": "Restaurant non trouvé",
  "error": "Aucun restaurant trouvé avec cet ID Mafalia"
}
```
**Solution :** Vérifier que le restaurant existe dans Bridge+ ou le créer d'abord.

---

## 📋 Checklist d'implémentation

### Phase 1 : Préparation
- [ ] Obtenir le token d'authentification `mafalia-api-token-2025`
- [ ] Vérifier l'URL de base `https://bridge-plus.com`
- [ ] Tester la connectivité réseau
- [ ] Préparer les données de test

### Phase 2 : Développement
- [ ] Implémenter le client HTTP dans votre système
- [ ] Créer les fonctions de synchronisation
- [ ] Implémenter la gestion des erreurs
- [ ] Ajouter la sauvegarde des mappings d'IDs

### Phase 3 : Tests
- [ ] Tester avec des données de test
- [ ] Valider les réponses API
- [ ] Tester la gestion des erreurs
- [ ] Vérifier la synchronisation bidirectionnelle

### Phase 4 : Production
- [ ] Configurer les tokens de production
- [ ] Mettre en place la synchronisation automatique
- [ ] Configurer le monitoring
- [ ] Documenter les procédures de maintenance

---

## 🔄 Stratégies de synchronisation

### 1. Synchronisation complète (recommandée)

```javascript
// Synchroniser tout en une fois
async function synchroniserComplet(restaurantId) {
  const restaurant = await getRestaurantFromMafalia(restaurantId);
  const categories = await getCategoriesFromMafalia(restaurantId);
  const produits = await getProduitsFromMafalia(restaurantId);
  
  const result = await client.syncRestaurant(restaurant, categories, produits);
  
  // Sauvegarder les mappings
  await saveMappings(result.data);
  
  return result;
}
```

### 2. Synchronisation par étapes

```javascript
// Synchroniser étape par étape
async function synchroniserParEtapes(restaurantId) {
  // 1. Restaurant
  const restaurant = await getRestaurantFromMafalia(restaurantId);
  const restaurantResult = await client.syncRestaurant(restaurant, [], []);
  
  // 2. Catégories
  const categories = await getCategoriesFromMafalia(restaurantId);
  const categoriesResult = await client.syncCategories(categories);
  
  // 3. Produits
  const produits = await getProduitsFromMafalia(restaurantId);
  const produitsResult = await client.syncProducts(produits);
  
  return {
    restaurant: restaurantResult,
    categories: categoriesResult,
    produits: produitsResult
  };
}
```

### 3. Synchronisation incrémentale

```javascript
// Synchroniser seulement les changements
async function synchroniserIncrementale(restaurantId, lastSync) {
  const changes = await getChangesSince(restaurantId, lastSync);
  
  if (changes.restaurant) {
    await client.syncRestaurant(changes.restaurant, [], []);
  }
  
  if (changes.categories.length > 0) {
    await client.syncCategories(changes.categories);
  }
  
  if (changes.produits.length > 0) {
    await client.syncProducts(changes.produits);
  }
}
```

---

## 📊 Monitoring et maintenance

### 1. Vérification du statut

```javascript
// Vérifier le statut de synchronisation
async function verifierStatut(restaurantId) {
  try {
    const status = await client.getSyncStatus(restaurantId);
    
    console.log(`Restaurant: ${status.data.nom_restaurant}`);
    console.log(`Catégories: ${status.data.categories_count}`);
    console.log(`Produits: ${status.data.produits_count}`);
    console.log(`Dernière sync: ${status.data.last_sync}`);
    
    return status.data;
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    throw error;
  }
}
```

### 2. Logs et debugging

```javascript
// Ajouter des logs détaillés
async function synchroniserAvecLogs(restaurant, categories, produits) {
  console.log('🔄 Début de la synchronisation...');
  console.log(`Restaurant: ${restaurant.nom_restaurant}`);
  console.log(`Catégories: ${categories.length}`);
  console.log(`Produits: ${produits.length}`);
  
  try {
    const result = await client.syncRestaurant(restaurant, categories, produits);
    
    console.log('✅ Synchronisation réussie');
    console.log('Mappings:', result.data);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur de synchronisation:', error);
    throw error;
  }
}
```

### 3. Gestion des échecs

```javascript
// Retry automatique en cas d'échec
async function synchroniserAvecRetry(restaurant, categories, produits, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${maxRetries}`);
      return await client.syncRestaurant(restaurant, categories, produits);
    } catch (error) {
      console.error(`Tentative ${attempt} échouée:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Échec après ${maxRetries} tentatives: ${error.message}`);
      }
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

---

## 🆘 Support et dépannage

### Questions fréquentes

#### Q: Mon token d'authentification ne fonctionne pas
**R:** Vérifiez que vous utilisez exactement `mafalia-api-token-2025` et que le header `Authorization: Bearer` est correctement formaté.

#### Q: Les produits ne sont pas liés à la bonne catégorie
**R:** Assurez-vous que le `categorie_id` dans les produits correspond à un `id` de catégorie existant dans la même requête.

#### Q: Comment savoir si la synchronisation a réussi ?
**R:** Vérifiez la réponse API pour `"success": true` et utilisez l'endpoint de statut pour confirmer les données.

#### Q: Puis-je synchroniser plusieurs restaurants en même temps ?
**R:** Oui, mais faites une requête séparée pour chaque restaurant pour éviter les conflits.

#### Q: Que faire si un produit existe déjà ?
**R:** L'API mettra automatiquement à jour le produit existant avec les nouvelles données.

### Contact support

En cas de problème technique :
1. Vérifiez les logs de votre application
2. Testez avec l'endpoint de statut
3. Consultez les codes d'erreur HTTP
4. Contactez l'équipe Bridge+ avec les détails de l'erreur

---

## 📚 Ressources supplémentaires

### Documentation API complète
- Voir `app/api/bridge/README.md` pour la documentation technique détaillée

### Exemples de code
- Client TypeScript : `lib/mafalia-client.ts`
- Script de test : `scripts/test-mafalia-integration.js`

### Configuration
- Variables d'environnement : `lib/config.ts`
- Middleware d'authentification : `lib/auth-middleware.ts`

---

## 🎯 Prochaines étapes

Une fois l'intégration de base fonctionnelle, vous pourrez :

1. **Automatiser la synchronisation** avec des tâches programmées
2. **Implémenter les webhooks** pour la synchronisation en temps réel
3. **Ajouter la synchronisation bidirectionnelle** (Bridge+ → Mafalia)
4. **Créer une interface d'administration** pour gérer les synchronisations
5. **Implémenter le monitoring avancé** avec alertes

---

**🎉 Félicitations ! Vous avez maintenant toutes les informations nécessaires pour intégrer Mafalia avec Bridge+. Bon développement !**
