# 📋 Guide d'Intégration Mafalia - Gestion des Commandes Bridge+

## 🎯 Vue d'ensemble

Ce guide vous accompagne dans l'intégration avec l'API Bridge+ pour la gestion des commandes. Vous pourrez récupérer les commandes, suivre leur statut et les mettre à jour selon votre processus de livraison.

## 🚀 Démarrage Rapide

### 1. Configuration de base

```javascript
const config = {
  baseUrl: 'https://b.mafalia.com/api',
  token: 'mafalia-api-token-2025'
};
```

### 2. Test de connectivité

```bash
curl -H "Authorization: Bearer mafalia-api-token-2025" \
     https://b.mafalia.com/api/commandes?limit=1
```

### 3. Premier test

Ouvrez `test-commandes-mafalia.html` dans votre navigateur pour tester l'interface.

## 📊 Statuts de Commande

### Flux recommandé pour Mafalia :

```
en_attente → traite → remis_livreur → en_livraison → livree
```

| Statut | Description | Action Mafalia |
|--------|-------------|----------------|
| `en_attente` | Commande reçue | ✅ Récupérer et traiter |
| `traite` | Prise en charge | ✅ Assigner un livreur |
| `remis_livreur` | Remise au livreur | ✅ Livreur en route |
| `en_livraison` | En cours de livraison | ✅ Suivre la position |
| `livree` | Livraison terminée | ✅ Confirmer la livraison |

## 🔧 Exemples d'Intégration

### JavaScript/Node.js

```javascript
const axios = require('axios');

class MafaliaBridgeClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Récupérer les commandes en attente
  async getPendingOrders() {
    const response = await axios.get(`${this.baseUrl}/commandes`, {
      headers: this.headers,
      params: { statut: 'en_attente', limit: 50 }
    });
    return response.data.data.commandes;
  }

  // Mettre à jour le statut d'une commande
  async updateOrderStatus(commandeId, nouveauStatut, raison, metadata = {}) {
    const response = await axios.put(`${this.baseUrl}/commandes/${commandeId}`, {
      statut: nouveauStatut,
      raison: raison,
      modifie_par: 'mafalia_system',
      type_modificateur: 'mafalia',
      metadata
    }, {
      headers: this.headers
    });
    return response.data;
  }

  // Traiter une commande complète
  async processOrder(commandeId, livreurInfo) {
    try {
      // 1. Marquer comme traité
      await this.updateOrderStatus(commandeId, 'traite', 'Commande prise en charge');
      
      // 2. Remettre au livreur
      await this.updateOrderStatus(commandeId, 'remis_livreur', 'Commande remise au livreur', {
        livreur_id: livreurInfo.id,
        livreur_nom: livreurInfo.nom,
        livreur_telephone: livreurInfo.telephone
      });
      
      return { success: true, message: 'Commande traitée avec succès' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Utilisation
const client = new MafaliaBridgeClient({
  baseUrl: 'https://bridge-plus.com/api',
  token: 'mafalia-api-token-2025'
});

// Traiter toutes les commandes en attente
async function processAllPendingOrders() {
  const orders = await client.getPendingOrders();
  
  for (const order of orders) {
    const livreurInfo = {
      id: 'livreur_123',
      nom: 'Amadou Diallo',
      telephone: '771234567'
    };
    
    const result = await client.processOrder(order.id, livreurInfo);
    console.log(`Commande ${order.numero_commande}: ${result.message}`);
  }
}
```

### Python

```python
import requests
import json
from datetime import datetime

class MafaliaBridgeClient:
    def __init__(self, config):
        self.base_url = config['baseUrl']
        self.token = config['token']
        self.headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def get_pending_orders(self):
        response = requests.get(f'{self.base_url}/commandes', 
                              headers=self.headers,
                              params={'statut': 'en_attente', 'limit': 50})
        return response.json()['data']['commandes']
    
    def update_order_status(self, commande_id, nouveau_statut, raison, metadata=None):
        data = {
            'statut': nouveau_statut,
            'raison': raison,
            'modifie_par': 'mafalia_system',
            'type_modificateur': 'mafalia'
        }
        
        if metadata:
            data['metadata'] = metadata
        
        response = requests.put(f'{self.base_url}/commandes/{commande_id}',
                              headers=self.headers,
                              json=data)
        return response.json()
    
    def process_order(self, commande_id, livreur_info):
        try:
            # 1. Marquer comme traité
            self.update_order_status(commande_id, 'traite', 'Commande prise en charge')
            
            # 2. Remettre au livreur
            self.update_order_status(commande_id, 'remis_livreur', 'Commande remise au livreur', {
                'livreur_id': livreur_info['id'],
                'livreur_nom': livreur_info['nom'],
                'livreur_telephone': livreur_info['telephone']
            })
            
            return {'success': True, 'message': 'Commande traitée avec succès'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Utilisation
config = {
    'baseUrl': 'https://b.mafalia.com/api',
    'token': 'mafalia-api-token-2025'
}

client = MafaliaBridgeClient(config)

# Traiter toutes les commandes en attente
def process_all_pending_orders():
    orders = client.get_pending_orders()
    
    for order in orders:
        livreur_info = {
            'id': 'livreur_123',
            'nom': 'Amadou Diallo',
            'telephone': '771234567'
        }
        
        result = client.process_order(order['id'], livreur_info)
        print(f"Commande {order['numero_commande']}: {result['message']}")
```

## 🔄 Intégration avec votre système

### 1. Polling des commandes

```javascript
// Vérifier les nouvelles commandes toutes les 30 secondes
setInterval(async () => {
  const orders = await client.getPendingOrders();
  if (orders.length > 0) {
    console.log(`${orders.length} nouvelles commandes à traiter`);
    // Traiter les commandes...
  }
}, 30000);
```

### 2. Webhooks (optionnel)

Si vous souhaitez recevoir des notifications en temps réel :

```javascript
// Endpoint webhook dans votre système
app.post('/webhooks/bridge-plus', (req, res) => {
  const { event, commande_id, nouveau_statut } = req.body;
  
  if (event === 'commande_status_changed') {
    console.log(`Commande ${commande_id} mise à jour: ${nouveau_statut}`);
    // Mettre à jour votre système...
  }
  
  res.status(200).send('OK');
});
```

### 3. Gestion des erreurs

```javascript
async function safeUpdateStatus(commandeId, statut, raison) {
  try {
    const result = await client.updateOrderStatus(commandeId, statut, raison);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Erreur mise à jour commande ${commandeId}:`, error);
    
    // Retry logic
    if (error.response?.status === 500) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await client.updateOrderStatus(commandeId, statut, raison);
    }
    
    return { success: false, error: error.message };
  }
}
```

## 📊 Monitoring et Logs

### Métriques importantes à suivre :

- **Temps de traitement** : Temps entre `en_attente` et `traite`
- **Taux de succès** : Pourcentage de commandes livrées avec succès
- **Erreurs API** : Nombre et types d'erreurs
- **Volume de commandes** : Nombre de commandes traitées par jour

### Exemple de logging :

```javascript
class OrderLogger {
  logOrderUpdate(commandeId, ancienStatut, nouveauStatut, temps) {
    console.log({
      timestamp: new Date().toISOString(),
      commande_id: commandeId,
      ancien_statut: ancienStatut,
      nouveau_statut: nouveauStatut,
      temps_traitement: temps,
      source: 'mafalia_system'
    });
  }
}
```

## 🧪 Tests

### 1. Tests unitaires

```javascript
describe('Mafalia Bridge Integration', () => {
  test('should fetch pending orders', async () => {
    const orders = await client.getPendingOrders();
    expect(Array.isArray(orders)).toBe(true);
  });
  
  test('should update order status', async () => {
    const result = await client.updateOrderStatus('test-id', 'traite', 'Test');
    expect(result.success).toBe(true);
  });
});
```

### 2. Tests d'intégration

Utilisez les fichiers de test fournis :
- `test-commandes-mafalia.js` - Tests Node.js
- `test-commandes-mafalia.html` - Tests navigateur

## 🚨 Gestion des Erreurs

### Codes d'erreur courants :

| Code | Description | Action |
|------|-------------|--------|
| 401 | Token invalide | Vérifier le token d'authentification |
| 404 | Commande non trouvée | Vérifier l'ID de la commande |
| 400 | Données invalides | Vérifier le format des données |
| 500 | Erreur serveur | Réessayer après un délai |

### Stratégie de retry :

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 📞 Support

### En cas de problème :

1. **Vérifiez la connectivité** avec le test de base
2. **Consultez les logs** de votre application
3. **Testez avec les outils fournis** (HTML/JS)
4. **Contactez le support** : support@bridge-plus.com

### Informations utiles à fournir :

- ID de la commande concernée
- Code d'erreur HTTP
- Message d'erreur complet
- Timestamp de l'erreur
- Configuration utilisée (sans le token)

## 📚 Ressources

- **Documentation complète** : `CONTRAT_INTERFACE_COMMANDES_MAFALIA.md`
- **Configuration** : `mafalia-commandes-config.json`
- **Tests** : `test-commandes-mafalia.html` et `test-commandes-mafalia.js`
- **Status API** : https://status.bridge-plus.com

---

**Version :** 1.0  
**Dernière mise à jour :** 26 Septembre 2025  
**Contact :** support@bridge-plus.com
