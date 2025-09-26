import { useCartStore } from '@/lib/stores/cartStore';

export interface CreateOrderRequest {
  nom_client: string;
  email_client?: string;
  telephone_client: string;
  adresse_livraison: string;
  instructions_livraison?: string;
  code_promo?: string;
  notes_commande?: string;
}

export interface CreateTransactionRequest {
  commande_id: string;
  montant: number;
  methode_paiement: 'mobile_money' | 'carte_bancaire' | 'especes' | 'virement';
  operateur?: string;
  reference_paiement?: string;
  ip_client?: string;
  user_agent?: string;
  metadata?: any;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data?: {
    commande_id: string;
  };
  error?: string;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data?: {
    transaction_id: string;
    numero_transaction: string;
  };
  error?: string;
}

class OrderService {
  private baseUrl = '/api';

  async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
    const cart = useCartStore.getState();
    
    if (cart.items.length === 0) {
      return {
        success: false,
        message: 'Panier vide',
        error: 'Le panier ne peut pas être vide'
      };
    }

    // Grouper les items par restaurant
    const itemsByRestaurant = cart.items.reduce((acc, item) => {
      if (!acc[item.restaurant_id]) {
        acc[item.restaurant_id] = [];
      }
      acc[item.restaurant_id].push(item);
      return acc;
    }, {} as Record<string, typeof cart.items>);

    // Créer une commande pour chaque restaurant
    const orderPromises = Object.entries(itemsByRestaurant).map(async ([restaurantId, items]) => {
      const orderPayload = {
        ...orderData,
        restaurant_id: restaurantId,
        items: items.map(item => ({
          produit_id: item.produit_id,
          produit_nom: item.produit_nom,
          prix_unitaire: item.prix_unitaire,
          quantite: item.quantite,
          image: item.image,
          categorie_id: item.categorie_id,
          accompagnants: item.accompagnants
        }))
      };

      const response = await fetch(`${this.baseUrl}/commandes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'mafalia-api-token-2025'}`
        },
        body: JSON.stringify(orderPayload)
      });

      return response.json();
    });

    try {
      const results = await Promise.all(orderPromises);
      
      // Vérifier si toutes les commandes ont été créées avec succès
      const failedOrders = results.filter(result => !result.success);
      if (failedOrders.length > 0) {
        return {
          success: false,
          message: 'Erreur lors de la création des commandes',
          error: failedOrders.map(order => order.error).join(', ')
        };
      }

      // Retourner la première commande créée (ou toutes si nécessaire)
      return results[0];
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la création de la commande',
        error: error.message
      };
    }
  }

  async createTransaction(transactionData: CreateTransactionRequest): Promise<TransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'mafalia-api-token-2025'}`
        },
        body: JSON.stringify(transactionData)
      });

      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la création de la transaction',
        error: error.message
      };
    }
  }

  async updateTransactionStatus(transactionId: string, statut: string, reference_paiement?: string, metadata?: any): Promise<TransactionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'mafalia-api-token-2025'}`
        },
        body: JSON.stringify({
          statut,
          reference_paiement,
          metadata
        })
      });

      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la mise à jour de la transaction',
        error: error.message
      };
    }
  }

  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/commandes/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'mafalia-api-token-2025'}`
        }
      });

      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la récupération de la commande',
        error: error.message
      };
    }
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    restaurantId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/commandes?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'mafalia-api-token-2025'}`
        }
      });

      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message
      };
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/commandes/${orderId}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la récupération de la commande',
        error: error.message
      };
    }
  }

  async getOrderStatistics(params?: {
    type?: 'overview' | 'daily' | 'restaurants' | 'status' | 'revenue';
    restaurantId?: string;
    dateFrom?: string;
    dateTo?: string;
    period?: string;
  }): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`${this.baseUrl}/commandes/statistiques?${searchParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'mafalia-api-token-2025'}`
        }
      });

      return response.json();
    } catch (error: any) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      };
    }
  }
}

export const orderService = new OrderService();
