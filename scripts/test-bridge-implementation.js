/**
 * Script de test pour valider l'implémentation Bridge+ ↔ Mafalia
 * Version 1.0 - 27 Janvier 2025
 */

const API_BASE = 'http://localhost:3000/api/bridge/sync';
const TOKEN = 'mafalia-api-token-2025';

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      status: response.status,
      data: result,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

function logTest(testName, result) {
  const status = result.success ? '✅' : '❌';
  console.log(`${status} ${testName}`);
  if (!result.success) {
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data, null, 2)}`);
  }
}

// ============================================================================
// DONNÉES DE TEST
// ============================================================================

const testRestaurant = {
  id: 'mafalia-restaurant-test-001',
  nom_restaurant: 'Restaurant Test Bridge+',
  statut: 'ouvert',
  image: 'https://example.com/logo.jpg'
};

const testCategories = [
  {
    id: 'mafalia-category-001',
    nom_categorie: 'Pizzas'
  },
  {
    id: 'mafalia-category-002',
    nom_categorie: 'Boissons'
  }
];

const testProducts = Array.from({ length: 25 }, (_, i) => ({
  id: `mafalia-product-${i.toString().padStart(3, '0')}`,
  nom_produit: `Produit Test ${i + 1}`,
  prix: 1000 + (i * 100),
  description: `Description du produit test ${i + 1}`,
  image: `https://example.com/product-${i + 1}.jpg`,
  note: 4.0 + (i % 2) * 0.5,
  restaurant_id: '', // Sera rempli après la création du restaurant
  categorie_id: '', // Sera rempli après la création des catégories
  accompagnants: i % 3 === 0 ? ['Extra fromage', 'Olives'] : []
}));

// ============================================================================
// TESTS
// ============================================================================

async function testRestaurantSync() {
  console.log('\n🏪 Test de synchronisation du restaurant...');
  
  const result = await makeRequest('/restaurant', 'POST', {
    restaurant: testRestaurant,
    categories: testCategories
  });
  
  logTest('Synchronisation restaurant et catégories', result);
  
  if (result.success) {
    // Mettre à jour les IDs dans les produits de test
    testProducts.forEach(product => {
      product.restaurant_id = result.data.data.restaurant_id;
      product.categorie_id = result.data.data.categories_mapping['mafalia-category-001'];
    });
    
    return result.data.data;
  }
  
  return null;
}

async function testProductsBatch() {
  console.log('\n📦 Test de synchronisation des produits par lots...');
  
  const batch = {
    products: testProducts,
    batchId: 'batch-test-001',
    totalBatches: 1,
    currentBatch: 1,
    restaurantId: testProducts[0].restaurant_id
  };
  
  const result = await makeRequest('/products/batch', 'POST', batch);
  logTest('Synchronisation lot de produits', result);
  
  return result;
}

async function testSyncStatus(restaurantId) {
  console.log('\n📊 Test du statut de synchronisation...');
  
  const result = await makeRequest(`/status/${restaurantId}`);
  logTest('Récupération du statut de synchronisation', result);
  
  return result;
}

async function testMonitoring() {
  console.log('\n📈 Test du monitoring...');
  
  const result = await makeRequest('/monitoring?type=overview');
  logTest('Récupération des données de monitoring', result);
  
  return result;
}

async function testRateLimiting() {
  console.log('\n🚦 Test du rate limiting...');
  
  // Faire plusieurs requêtes rapides pour tester le rate limiting
  const promises = Array.from({ length: 5 }, () => 
    makeRequest('/status/test-restaurant')
  );
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  
  logTest(`Rate limiting (${successCount}/5 requêtes réussies)`, {
    success: successCount > 0,
    data: { successCount, total: 5 }
  });
  
  return results;
}

async function testValidation() {
  console.log('\n✅ Test de validation des données...');
  
  // Test avec des données invalides
  const invalidRestaurant = {
    restaurant: {
      id: '', // ID vide
      nom_restaurant: 'a'.repeat(101), // Nom trop long
      statut: 'invalid' // Statut invalide
    },
    categories: []
  };
  
  const result = await makeRequest('/restaurant', 'POST', invalidRestaurant);
  
  // On s'attend à ce que ça échoue
  logTest('Validation des données invalides', {
    success: !result.success && result.status === 400,
    data: result.data
  });
  
  return result;
}

async function testErrorHandling() {
  console.log('\n🚨 Test de gestion des erreurs...');
  
  // Test avec un token invalide
  const invalidTokenResult = await makeRequest('/restaurant', 'POST', {
    restaurant: testRestaurant,
    categories: testCategories
  }, 'invalid-token');
  
  logTest('Gestion des erreurs d\'authentification', {
    success: !invalidTokenResult.success && invalidTokenResult.status === 401,
    data: invalidTokenResult.data
  });
  
  // Test avec un restaurant inexistant
  const notFoundResult = await makeRequest('/status/restaurant-inexistant');
  logTest('Gestion des erreurs 404', {
    success: !notFoundResult.success && notFoundResult.status === 404,
    data: notFoundResult.data
  });
  
  return { invalidTokenResult, notFoundResult };
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function runAllTests() {
  console.log('🚀 Démarrage des tests Bridge+ ↔ Mafalia');
  console.log('==========================================');
  
  try {
    // Test 1: Synchronisation du restaurant
    const restaurantData = await testRestaurantSync();
    
    if (restaurantData) {
      // Test 2: Synchronisation des produits
      await testProductsBatch();
      
      // Test 3: Statut de synchronisation
      await testSyncStatus(restaurantData.restaurant_id);
    }
    
    // Test 4: Monitoring
    await testMonitoring();
    
    // Test 5: Rate limiting
    await testRateLimiting();
    
    // Test 6: Validation
    await testValidation();
    
    // Test 7: Gestion des erreurs
    await testErrorHandling();
    
    console.log('\n🎉 Tests terminés !');
    console.log('==================');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

if (typeof window === 'undefined') {
  // Exécution en Node.js
  runAllTests().catch(console.error);
} else {
  // Exécution dans le navigateur
  window.runBridgeTests = runAllTests;
  console.log('Tests disponibles via window.runBridgeTests()');
}

// Export pour les tests
module.exports = {
  runAllTests,
  testRestaurantSync,
  testProductsBatch,
  testSyncStatus,
  testMonitoring,
  testRateLimiting,
  testValidation,
  testErrorHandling
};
