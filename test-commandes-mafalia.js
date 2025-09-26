/**
 * Script de test pour l'intégration Mafalia - Gestion des Commandes Bridge+
 * 
 * Ce script permet de tester :
 * 1. Récupération des commandes
 * 2. Mise à jour des statuts
 * 3. Récupération des statistiques
 */

const API_BASE = 'https://b.mafalia.com/api'; // URL de production
const API_TOKEN = 'mafalia-api-token-2025';

// Configuration
const config = {
  baseUrl: API_BASE,
  token: API_TOKEN,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

// Fonctions utilitaires
async function makeRequest(method, endpoint, data = null) {
  const url = `${config.baseUrl}${endpoint}`;
  const options = {
    method,
    headers: config.headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`\n🔗 ${method} ${endpoint}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(result, null, 2));
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error(`❌ Erreur ${method} ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Tests des endpoints
async function testGetCommandes() {
  console.log('\n🧪 TEST 1: Récupération des commandes');
  
  // Test 1.1: Récupérer toutes les commandes
  await makeRequest('GET', '/commandes?limit=5');
  
  // Test 1.2: Filtrer par statut
  await makeRequest('GET', '/commandes?statut=en_attente&limit=3');
  
  // Test 1.3: Filtrer par date
  const today = new Date().toISOString().split('T')[0];
  await makeRequest('GET', `/commandes?dateFrom=${today}&limit=3`);
}

async function testGetCommandeById() {
  console.log('\n🧪 TEST 2: Récupération d\'une commande spécifique');
  
  // D'abord récupérer une commande pour avoir son ID
  const result = await makeRequest('GET', '/commandes?limit=1');
  
  if (result.success && result.data.data.commandes.length > 0) {
    const commandeId = result.data.data.commandes[0].id;
    await makeRequest('GET', `/commandes/${commandeId}`);
    return commandeId;
  } else {
    console.log('❌ Aucune commande trouvée pour le test');
    return null;
  }
}

async function testUpdateCommandeStatus(commandeId) {
  console.log('\n🧪 TEST 3: Mise à jour du statut d\'une commande');
  
  if (!commandeId) {
    console.log('❌ ID de commande manquant pour le test');
    return;
  }
  
  // Test 3.1: Marquer comme traité
  await makeRequest('PUT', `/${commandeId}`, {
    statut: 'traite',
    raison: 'Commande traitée par Mafalia (test)',
    modifie_par: 'mafalia_test_system',
    type_modificateur: 'mafalia',
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  });
  
  // Test 3.2: Remettre au livreur
  await makeRequest('PUT', `/${commandeId}`, {
    statut: 'remis_livreur',
    raison: 'Commande remise au livreur (test)',
    modifie_par: 'mafalia_test_system',
    type_modificateur: 'mafalia',
    metadata: {
      livreur_id: 'test_livreur_123',
      livreur_nom: 'Test Livreur',
      livreur_telephone: '771234567'
    }
  });
  
  // Test 3.3: En cours de livraison
  await makeRequest('PUT', `/${commandeId}`, {
    statut: 'en_livraison',
    raison: 'Livreur en route (test)',
    modifie_par: 'test_livreur_123',
    type_modificateur: 'livreur',
    metadata: {
      position_livreur: {
        latitude: 14.7167,
        longitude: -17.4677
      },
      temps_estime: '15 minutes'
    }
  });
  
  // Test 3.4: Livraison terminée
  await makeRequest('PUT', `/${commandeId}`, {
    statut: 'livree',
    raison: 'Commande livrée avec succès (test)',
    modifie_par: 'test_livreur_123',
    type_modificateur: 'livreur',
    metadata: {
      heure_livraison: new Date().toISOString(),
      signature_client: 'test_signature_base64',
      photo_livraison: 'https://example.com/delivery_photo.jpg'
    }
  });
}

async function testGetStatistics() {
  console.log('\n🧪 TEST 4: Récupération des statistiques');
  
  // Test 4.1: Statistiques générales
  await makeRequest('GET', '/commandes/statistiques?type=overview');
  
  // Test 4.2: Statistiques par statut
  await makeRequest('GET', '/commandes/statistiques?type=status');
  
  // Test 4.3: Statistiques par restaurant
  await makeRequest('GET', '/commandes/statistiques?type=restaurants');
}

async function testErrorHandling() {
  console.log('\n🧪 TEST 5: Gestion des erreurs');
  
  // Test 5.1: Commande inexistante
  await makeRequest('GET', '/commandes/commande-inexistante-123');
  
  // Test 5.2: Statut invalide
  const result = await makeRequest('GET', '/commandes?limit=1');
  if (result.success && result.data.data.commandes.length > 0) {
    const commandeId = result.data.data.commandes[0].id;
    await makeRequest('PUT', `/${commandeId}`, {
      statut: 'statut_inexistant',
      raison: 'Test statut invalide'
    });
  }
  
  // Test 5.3: Token invalide
  const originalHeaders = config.headers;
  config.headers['Authorization'] = 'Bearer token-invalide';
  await makeRequest('GET', '/commandes?limit=1');
  config.headers = originalHeaders; // Restaurer le token correct
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS D\'INTÉGRATION MAFALIA');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Récupération des commandes
    await testGetCommandes();
    
    // Test 2: Récupération d'une commande spécifique
    const commandeId = await testGetCommandeById();
    
    // Test 3: Mise à jour des statuts
    await testUpdateCommandeStatus(commandeId);
    
    // Test 4: Statistiques
    await testGetStatistics();
    
    // Test 5: Gestion des erreurs
    await testErrorHandling();
    
    console.log('\n✅ TOUS LES TESTS TERMINÉS');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error);
  }
}

// Fonction pour tester un flux complet
async function testCompleteFlow() {
  console.log('\n🔄 TEST DE FLUX COMPLET');
  console.log('=' .repeat(30));
  
  try {
    // 1. Récupérer les commandes en attente
    console.log('\n1️⃣ Récupération des commandes en attente...');
    const result = await makeRequest('GET', '/commandes?statut=en_attente&limit=1');
    
    if (!result.success || !result.data.data.commandes.length) {
      console.log('❌ Aucune commande en attente trouvée');
      return;
    }
    
    const commande = result.data.data.commandes[0];
    console.log(`✅ Commande trouvée: ${commande.numero_commande} (${commande.nom_client})`);
    
    // 2. Traiter la commande
    console.log('\n2️⃣ Traitement de la commande...');
    await makeRequest('PUT', `/${commande.id}`, {
      statut: 'traite',
      raison: 'Commande traitée par Mafalia',
      modifie_par: 'mafalia_operator_001',
      type_modificateur: 'mafalia'
    });
    
    // 3. Remettre au livreur
    console.log('\n3️⃣ Remise au livreur...');
    await makeRequest('PUT', `/${commande.id}`, {
      statut: 'remis_livreur',
      raison: 'Commande remise au livreur',
      modifie_par: 'mafalia_operator_001',
      type_modificateur: 'mafalia',
      metadata: {
        livreur_id: 'livreur_456',
        livreur_nom: 'Amadou Diallo',
        livreur_telephone: '771234567'
      }
    });
    
    // 4. En cours de livraison
    console.log('\n4️⃣ Début de livraison...');
    await makeRequest('PUT', `/${commande.id}`, {
      statut: 'en_livraison',
      raison: 'Livreur en route vers le client',
      modifie_par: 'livreur_456',
      type_modificateur: 'livreur',
      metadata: {
        position_livreur: {
          latitude: 14.7167,
          longitude: -17.4677
        },
        temps_estime: '15 minutes'
      }
    });
    
    // 5. Livraison terminée
    console.log('\n5️⃣ Livraison terminée...');
    await makeRequest('PUT', `/${commande.id}`, {
      statut: 'livree',
      raison: 'Commande livrée avec succès',
      modifie_par: 'livreur_456',
      type_modificateur: 'livreur',
      metadata: {
        heure_livraison: new Date().toISOString(),
        signature_client: 'signature_base64_encoded',
        photo_livraison: 'https://storage.example.com/delivery_photo.jpg'
      }
    });
    
    console.log('\n✅ FLUX COMPLET TERMINÉ AVEC SUCCÈS!');
    
  } catch (error) {
    console.error('\n❌ ERREUR DANS LE FLUX COMPLET:', error);
  }
}

// Exécution des tests
if (typeof window === 'undefined') {
  // Node.js
  const fetch = require('node-fetch');
  global.fetch = fetch;
  
  // Lancer les tests
  runAllTests().then(() => {
    console.log('\n🎯 Tests terminés. Vérifiez les résultats ci-dessus.');
  });
} else {
  // Navigateur
  console.log('🌐 Version navigateur détectée');
  console.log('Utilisez runAllTests() ou testCompleteFlow() dans la console');
  
  // Exposer les fonctions globalement
  window.runAllTests = runAllTests;
  window.testCompleteFlow = testCompleteFlow;
  window.makeRequest = makeRequest;
}

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testCompleteFlow,
    makeRequest,
    config
  };
}
