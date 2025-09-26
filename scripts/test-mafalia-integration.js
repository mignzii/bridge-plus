/**
 * Script de test pour l'intégration Mafalia
 * Usage: node scripts/test-mafalia-integration.js
 */

const BASE_URL = 'http://localhost:3000';
const API_TOKEN = 'test-token-123'; // Remplacez par votre vrai token

// Données de test
const testRestaurant = {
  id: 'mafalia_test_restaurant_001',
  nom_restaurant: 'Restaurant Test Mafalia',
  statut: 'ouvert',
  image: 'https://example.com/test-restaurant.jpg'
};

const testCategories = [
  {
    id: 'mafalia_cat_001',
    nom_categorie: 'Fast Food Test'
  },
  {
    id: 'mafalia_cat_002',
    nom_categorie: 'Pizza Test'
  }
];

const testProducts = [
  {
    id: 'mafalia_prod_001',
    nom_produit: 'Burger Test Deluxe',
    prix: 5500,
    description: 'Un burger de test délicieux',
    image: 'https://example.com/burger-test.jpg',
    note: 4.8,
    restaurant_id: 'mafalia_test_restaurant_001',
    categorie_id: 'mafalia_cat_001',
    accompagnants: ['Frites', 'Salade', 'Sauce']
  },
  {
    id: 'mafalia_prod_002',
    nom_produit: 'Pizza Test Margherita',
    prix: 4500,
    description: 'Une pizza de test classique',
    image: 'https://example.com/pizza-test.jpg',
    note: 4.5,
    restaurant_id: 'mafalia_test_restaurant_001',
    categorie_id: 'mafalia_cat_002',
    accompagnants: ['Fromage', 'Tomate', 'Basilic']
  }
];

async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 0, data: { error: error.message } };
  }
}

async function testSyncRestaurant() {
  console.log('🧪 Test: Synchronisation complète du restaurant...');
  
  const response = await makeRequest('/api/bridge/sync/restaurant', 'POST', {
    restaurant: testRestaurant,
    categories: testCategories,
    produits: testProducts
  });

  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('✅ Synchronisation réussie!');
    return response.data.data;
  } else {
    console.log('❌ Échec de la synchronisation');
    return null;
  }
}

async function testSyncStatus(restaurantId) {
  console.log(`🧪 Test: Statut de synchronisation pour ${restaurantId}...`);
  
  const response = await makeRequest(`/api/bridge/sync/status/${restaurantId}`);
  
  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('✅ Statut récupéré avec succès!');
  } else {
    console.log('❌ Échec de la récupération du statut');
  }
}

async function testSyncCategories() {
  console.log('🧪 Test: Synchronisation des catégories...');
  
  const newCategories = [
    {
      id: 'mafalia_cat_003',
      nom_categorie: 'Boissons Test'
    }
  ];
  
  const response = await makeRequest('/api/bridge/sync/categories', 'POST', newCategories);
  
  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('✅ Catégories synchronisées avec succès!');
  } else {
    console.log('❌ Échec de la synchronisation des catégories');
  }
}

async function testSyncProducts() {
  console.log('🧪 Test: Synchronisation des produits...');
  
  const newProducts = [
    {
      id: 'mafalia_prod_003',
      nom_produit: 'Coca Cola Test',
      prix: 1000,
      description: 'Boisson rafraîchissante de test',
      restaurant_id: 'mafalia_test_restaurant_001',
      categorie_id: 'mafalia_cat_003',
      accompagnants: ['Glaçons']
    }
  ];
  
  const response = await makeRequest('/api/bridge/sync/products', 'POST', newProducts);
  
  console.log(`Status: ${response.status}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  if (response.data.success) {
    console.log('✅ Produits synchronisés avec succès!');
  } else {
    console.log('❌ Échec de la synchronisation des produits');
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests d\'intégration Mafalia...\n');
  
  try {
    // Test 1: Synchronisation complète
    const syncResult = await testSyncRestaurant();
    console.log('\n');
    
    if (syncResult) {
      // Test 2: Vérifier le statut
      await testSyncStatus(testRestaurant.id);
      console.log('\n');
      
      // Test 3: Synchronisation des catégories
      await testSyncCategories();
      console.log('\n');
      
      // Test 4: Synchronisation des produits
      await testSyncProducts();
      console.log('\n');
    }
    
    console.log('🎉 Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  testSyncRestaurant,
  testSyncStatus,
  testSyncCategories,
  testSyncProducts,
  runTests
};
