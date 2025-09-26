# 📋 Contrat d'Interface - Gestion des Commandes Bridge+

## 🎯 Vue d'ensemble

Ce document définit l'interface API pour permettre à **Mafalia** de :
- Récupérer les commandes avec tous leurs détails
- Mettre à jour le statut des commandes (traité, remis au livreur, en cours de livraison, terminé)

## 🔐 Authentification

Toutes les requêtes doivent inclure le header d'authentification :
```
Authorization: Bearer mafalia-api-token-2025
```

## 📊 Statuts de Commande

### Statuts disponibles :
- `en_attente` - Commande reçue, en attente de traitement
- `confirmee` - Commande confirmée par le restaurant
- `en_preparation` - Commande en cours de préparation
- `pret` - Commande prête à être récupérée
- `traite` - Commande traitée par Mafalia
- `remis_livreur` - Commande remise au livreur
- `en_livraison` - Commande en cours de livraison
- `livree` - Commande livrée au client
- `annulee` - Commande annulée

## 🔄 API Endpoints

### 1. Récupérer toutes les commandes

**Endpoint :** `GET /api/commandes`

**Paramètres de requête :**
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 20, max: 100)
- `statut` (optionnel) : Filtrer par statut
- `restaurant_id` (optionnel) : Filtrer par restaurant
- `dateFrom` (optionnel) : Date de début (format: YYYY-MM-DD)
- `dateTo` (optionnel) : Date de fin (format: YYYY-MM-DD)

**Exemple de requête :**
```bash
GET /api/commandes?page=1&limit=20&statut=en_attente&dateFrom=2025-01-01&dateTo=2025-01-31
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "commandes": [
      {
        "id": "c80d0d16-9361-4794-996a-87df4c878e4c",
        "numero_commande": "CMD-20250926-0003",
        "nom_client": "Ibrahima Miniane",
        "email_client": "client@example.com",
        "telephone_client": "762430964",
        "adresse_livraison": "Patte d'oie Builders",
        "instructions_livraison": "Sonner 2 fois",
        "statut": "en_attente",
        "sous_total": 7000,
        "rabais": 1400,
        "frais_livraison": 2000,
        "total": 7600,
        "total_items": 6,
        "code_promo": "",
        "notes_commande": "Commande urgente",
        "created_at": "2025-09-26T13:31:08.299Z",
        "updated_at": "2025-09-26T13:31:13.415Z",
        "date_livraison_prevue": null,
        "date_livraison_effective": null,
        "restaurant_id": "5bb7e8a0-9ec1-4a3e-be80-0fd8ad857f1f",
        "restaurant_nom": "Restaurant Lekeul",
        "commande_items": [
          {
            "id": "1bd08d94-36db-4aa4-9337-d358ff75e893",
            "produit_id": "d4629893-a3ed-4136-8d74-dcf2ce43c532",
            "produit_nom": "Thé au choix",
            "prix_unitaire": 1000,
            "quantite": 2,
            "sous_total": 2000,
            "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop",
            "accompagnants": []
          }
        ],
        "transactions": [
          {
            "id": "836fe78f-0c05-41ff-aed5-b76d83dd09c7",
            "numero_transaction": "TXN-20250926-D6WRVS",
            "type_transaction": "paiement",
            "statut": "reussie",
            "montant": 7600,
            "methode_paiement": "mobile_money",
            "operateur": "Wave",
            "reference_paiement": "PAY_1758893471848",
            "created_at": "2025-09-26T13:31:08.870Z"
          }
        ],
        "status_history": [
          {
            "id": "hist-123",
            "ancien_statut": "en_attente",
            "nouveau_statut": "confirmee",
            "raison": "Commande confirmée par le restaurant",
            "modifie_par": "restaurant",
            "type_modificateur": "restaurant",
            "created_at": "2025-09-26T13:31:13.415Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 2. Récupérer une commande spécifique

**Endpoint :** `GET /api/commandes/{commande_id}`

**Exemple de requête :**
```bash
GET /api/commandes/c80d0d16-9361-4794-996a-87df4c878e4c
```

**Réponse :** Même structure que l'item dans la liste des commandes

### 3. Mettre à jour le statut d'une commande

**Endpoint :** `PUT /api/commandes/{commande_id}`

**Headers :**
```
Content-Type: application/json
Authorization: Bearer mafalia-api-token-2025
```

**Body de la requête :**
```json
{
  "statut": "traite",
  "raison": "Commande traitée par Mafalia",
  "modifie_par": "mafalia_system",
  "type_modificateur": "mafalia",
  "metadata": {
    "livreur_id": "livreur_123",
    "temps_preparation": 25,
    "notes": "Commande prête pour livraison"
  }
}
```

**Paramètres :**
- `statut` (requis) : Nouveau statut de la commande
- `raison` (optionnel) : Raison du changement de statut
- `modifie_par` (optionnel) : Identifiant de qui modifie (défaut: "mafalia_system")
- `type_modificateur` (optionnel) : Type de modificateur (défaut: "mafalia")
- `metadata` (optionnel) : Données supplémentaires au format JSON

**Réponse :**
```json
{
  "success": true,
  "message": "Statut de la commande mis à jour avec succès",
  "data": {
    "commande_id": "c80d0d16-9361-4794-996a-87df4c878e4c",
    "ancien_statut": "en_attente",
    "nouveau_statut": "traite",
    "updated_at": "2025-09-26T14:15:30.123Z"
  }
}
```

## 🔄 Flux de Statuts Recommandé

### Pour Mafalia :
1. **`en_attente`** → **`traite`** : Commande prise en charge par Mafalia
2. **`traite`** → **`remis_livreur`** : Commande remise au livreur
3. **`remis_livreur`** → **`en_livraison`** : Livreur en route
4. **`en_livraison`** → **`livree`** : Livraison terminée

### Exemples de requêtes de mise à jour :

**1. Marquer comme traité :**
```json
{
  "statut": "traite",
  "raison": "Commande prise en charge par Mafalia",
  "modifie_par": "mafalia_operator_001",
  "type_modificateur": "mafalia"
}
```

**2. Remettre au livreur :**
```json
{
  "statut": "remis_livreur",
  "raison": "Commande remise au livreur",
  "modifie_par": "mafalia_operator_001",
  "type_modificateur": "mafalia",
  "metadata": {
    "livreur_id": "livreur_456",
    "livreur_nom": "Amadou Diallo",
    "livreur_telephone": "771234567"
  }
}
```

**3. En cours de livraison :**
```json
{
  "statut": "en_livraison",
  "raison": "Livreur en route vers le client",
  "modifie_par": "livreur_456",
  "type_modificateur": "livreur",
  "metadata": {
    "position_livreur": {
      "latitude": 14.7167,
      "longitude": -17.4677
    },
    "temps_estime": "15 minutes"
  }
}
```

**4. Livraison terminée :**
```json
{
  "statut": "livree",
  "raison": "Commande livrée avec succès",
  "modifie_par": "livreur_456",
  "type_modificateur": "livreur",
  "metadata": {
    "heure_livraison": "2025-09-26T15:30:00Z",
    "signature_client": "base64_encoded_signature",
    "photo_livraison": "https://storage.example.com/delivery_photo.jpg"
  }
}
```

## 📊 Statistiques des Commandes

**Endpoint :** `GET /api/commandes/statistiques`

**Paramètres :**
- `type` (optionnel) : Type de statistiques (`overview`, `daily`, `restaurants`, `status`, `revenue`)
- `restaurant_id` (optionnel) : Filtrer par restaurant
- `dateFrom` (optionnel) : Date de début
- `dateTo` (optionnel) : Date de fin
- `period` (optionnel) : Période (`day`, `week`, `month`)

**Exemple :**
```bash
GET /api/commandes/statistiques?type=overview&dateFrom=2025-01-01&dateTo=2025-01-31
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "total_commandes": 150,
    "commandes_par_statut": {
      "en_attente": 5,
      "confirmee": 10,
      "en_preparation": 8,
      "pret": 12,
      "traite": 15,
      "remis_livreur": 20,
      "en_livraison": 18,
      "livree": 60,
      "annulee": 2
    },
    "chiffre_affaires": {
      "total": 1250000,
      "moyenne_commande": 8333
    },
    "restaurants": [
      {
        "restaurant_id": "5bb7e8a0-9ec1-4a3e-be80-0fd8ad857f1f",
        "restaurant_nom": "Restaurant Lekeul",
        "nombre_commandes": 45,
        "chiffre_affaires": 375000
      }
    ]
  }
}
```

## 🚨 Gestion des Erreurs

### Codes d'erreur HTTP :
- `200` : Succès
- `400` : Requête invalide (données manquantes ou incorrectes)
- `401` : Non autorisé (token invalide ou manquant)
- `404` : Commande non trouvée
- `500` : Erreur serveur interne

### Format des erreurs :
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques de l'erreur",
  "code": "ERROR_CODE"
}
```

### Exemples d'erreurs :

**Commande non trouvée :**
```json
{
  "success": false,
  "message": "Commande non trouvée",
  "error": "Commande introuvable",
  "code": "COMMANDE_NOT_FOUND"
}
```

**Statut invalide :**
```json
{
  "success": false,
  "message": "Statut invalide",
  "error": "Le statut 'statut_inexistant' n'est pas valide",
  "code": "INVALID_STATUS"
}
```

## 🔄 Webhooks (Optionnel)

Pour recevoir des notifications en temps réel des changements de statut :

**Endpoint Mafalia :** `POST https://mafalia.com/webhooks/bridge-plus`

**Payload :**
```json
{
  "event": "commande_status_changed",
  "commande_id": "c80d0d16-9361-4794-996a-87df4c878e4c",
  "numero_commande": "CMD-20250926-0003",
  "ancien_statut": "en_attente",
  "nouveau_statut": "traite",
  "timestamp": "2025-09-26T14:15:30.123Z",
  "metadata": {
    "modifie_par": "mafalia_operator_001",
    "raison": "Commande prise en charge"
  }
}
```

## 📝 Exemples d'Intégration

### JavaScript/Node.js :
```javascript
const axios = require('axios');

const API_BASE = 'https://b.mafalia.com/api';
const API_TOKEN = 'mafalia-api-token-2025';

// Récupérer les commandes en attente
async function getPendingOrders() {
  try {
    const response = await axios.get(`${API_BASE}/commandes`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      params: { statut: 'en_attente', limit: 50 }
    });
    return response.data.data.commandes;
  } catch (error) {
    console.error('Erreur:', error.response.data);
  }
}

// Mettre à jour le statut d'une commande
async function updateOrderStatus(commandeId, nouveauStatut, raison) {
  try {
    const response = await axios.put(`${API_BASE}/commandes/${commandeId}`, {
      statut: nouveauStatut,
      raison: raison,
      modifie_par: 'mafalia_system',
      type_modificateur: 'mafalia'
    }, {
      headers: { 
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response.data);
  }
}

// Exemple d'utilisation
async function processOrders() {
  const orders = await getPendingOrders();
  
  for (const order of orders) {
    // Traiter la commande
    await updateOrderStatus(order.id, 'traite', 'Commande prise en charge');
    
    // Simuler le processus de livraison
    setTimeout(async () => {
      await updateOrderStatus(order.id, 'remis_livreur', 'Commande remise au livreur');
    }, 5000);
  }
}
```

### Python :
```python
import requests
import json

API_BASE = 'https://b.mafalia.com/api'
API_TOKEN = 'mafalia-api-token-2025'

headers = {
    'Authorization': f'Bearer {API_TOKEN}',
    'Content-Type': 'application/json'
}

def get_pending_orders():
    response = requests.get(f'{API_BASE}/commandes', 
                          headers=headers,
                          params={'statut': 'en_attente', 'limit': 50})
    return response.json()['data']['commandes']

def update_order_status(commande_id, nouveau_statut, raison):
    data = {
        'statut': nouveau_statut,
        'raison': raison,
        'modifie_par': 'mafalia_system',
        'type_modificateur': 'mafalia'
    }
    response = requests.put(f'{API_BASE}/commandes/{commande_id}',
                          headers=headers,
                          json=data)
    return response.json()
```

## 🔧 Configuration et Tests

### URL de base :
- **Production :** `https://b.mafalia.com/api`
- **Staging :** `https://staging.b.mafalia.com/api`
- **Développement :** `http://localhost:3002/api`

### Token d'authentification :
```
mafalia-api-token-2025
```

### Tests de connectivité :
```bash
# Test de base
curl -H "Authorization: Bearer mafalia-api-token-2025" \
     https://b.mafalia.com/api/commandes?limit=1

# Test de mise à jour
curl -X PUT \
     -H "Authorization: Bearer mafalia-api-token-2025" \
     -H "Content-Type: application/json" \
     -d '{"statut":"traite","raison":"Test"}' \
     https://b.mafalia.com/api/commandes/COMMANDE_ID
```

## 📞 Support

Pour toute question ou problème :
- **Email :** support@bridge-plus.com
- **Documentation :** https://docs.bridge-plus.com
- **Status API :** https://status.bridge-plus.com

---

**Version :** 1.0  
**Date :** 26 Septembre 2025  
**Dernière mise à jour :** 26 Septembre 2025
