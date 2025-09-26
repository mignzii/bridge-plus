/**
 * Client Mafalia pour l'intégration avec Bridge+
 * Ce fichier peut être utilisé côté Mafalia pour faciliter l'intégration
 */

export interface MafaliaRestaurant {
  id: string;
  nom_restaurant: string;
  statut: string;
  image?: string;
}

export interface MafaliaCategory {
  id: string;
  nom_categorie: string;
}

export interface MafaliaProduct {
  id: string;
  nom_produit: string;
  prix: number;
  description?: string;
  image?: string;
  note?: number;
  restaurant_id: string;
  categorie_id?: string;
  accompagnants?: string[];
}

export interface SyncResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class MafaliaBridgeClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Supprimer le slash final
    this.apiToken = apiToken;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<SyncResponse> {
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
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur de communication avec Bridge+',
        error: error.message,
      };
    }
  }

  /**
   * Synchronise complètement un restaurant avec toutes ses données
   */
  async syncRestaurant(
    restaurant: MafaliaRestaurant,
    categories: MafaliaCategory[],
    produits: MafaliaProduct[]
  ): Promise<SyncResponse> {
    return this.makeRequest('/api/bridge/sync/restaurant', 'POST', {
      restaurant,
      categories,
      produits,
    });
  }

  /**
   * Synchronise uniquement les catégories
   */
  async syncCategories(categories: MafaliaCategory[]): Promise<SyncResponse> {
    return this.makeRequest('/api/bridge/sync/categories', 'POST', categories);
  }

  /**
   * Synchronise uniquement les produits
   */
  async syncProducts(produits: MafaliaProduct[]): Promise<SyncResponse> {
    return this.makeRequest('/api/bridge/sync/products', 'POST', produits);
  }

  /**
   * Récupère le statut de synchronisation d'un restaurant
   */
  async getSyncStatus(restaurantId: string): Promise<SyncResponse> {
    return this.makeRequest(`/api/bridge/sync/status/${restaurantId}`);
  }

  /**
   * Méthode utilitaire pour synchroniser par étapes
   */
  async syncRestaurantStepByStep(
    restaurant: MafaliaRestaurant,
    categories: MafaliaCategory[],
    produits: MafaliaProduct[]
  ): Promise<{
    restaurant: SyncResponse;
    categories: SyncResponse;
    products: SyncResponse;
  }> {
    // 1. Synchroniser le restaurant seul
    const restaurantResult = await this.syncRestaurant(restaurant, [], []);

    // 2. Synchroniser les catégories
    const categoriesResult = await this.syncCategories(categories);

    // 3. Synchroniser les produits
    const productsResult = await this.syncProducts(produits);

    return {
      restaurant: restaurantResult,
      categories: categoriesResult,
      products: productsResult,
    };
  }
}

// Exemple d'utilisation
export const createMafaliaClient = (baseUrl: string, apiToken: string) => {
  return new MafaliaBridgeClient(baseUrl, apiToken);
};

// Exemple d'utilisation dans Mafalia
/*
const client = createMafaliaClient('https://bridge-plus.com', 'your-api-token');

// Synchronisation complète
const result = await client.syncRestaurant(
  {
    id: 'restaurant_123',
    nom_restaurant: 'Mon Restaurant',
    statut: 'ouvert',
    image: 'https://example.com/image.jpg'
  },
  [
    {
      id: 'cat_1',
      nom_categorie: 'Fast Food'
    }
  ],
  [
    {
      id: 'prod_1',
      nom_produit: 'Burger Deluxe',
      prix: 5000,
      description: 'Un délicieux burger',
      restaurant_id: 'restaurant_123',
      categorie_id: 'cat_1',
      accompagnants: ['Frites', 'Salade']
    }
  ]
);

if (result.success) {
  console.log('Synchronisation réussie:', result.data);
} else {
  console.error('Erreur:', result.error);
}
*/
