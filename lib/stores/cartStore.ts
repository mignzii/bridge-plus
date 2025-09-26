import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  produit_id: string;
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
  image: string;
  accompagnants: string[];
  categorie_id: string;
  restaurant_id: string;
}

export interface CartSummary {
  total_items: number;
  sous_total: number;
  rabais: number;
  frais_livraison: number;
  total: number;
  code_promo: string;
}

interface CartStore {
  // État
  items: CartItem[];
  summary: CartSummary;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantite: number) => void;
  clearCart: () => void;
  updateAccompagnants: (itemId: string, accompagnants: string[]) => void;
  applyPromoCode: (code: string) => void;
  
  // Getters
  getItemCount: () => number;
  getTotalPrice: () => number;
  getItemsByRestaurant: (restaurantId: string) => CartItem[];
  
  // Recalcul
  recalculateSummary: () => void;
}

const calculateSummary = (items: CartItem[], code_promo: string = ''): CartSummary => {
  const total_items = items.reduce((sum, item) => sum + item.quantite, 0);
  const sous_total = items.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
  const rabais = sous_total * 0.2; // 20% de réduction par défaut
  const frais_livraison = 0; // Pas de frais dans le panier, calculés au paiement
  const total = sous_total - rabais; // Total sans frais de livraison
  
  return {
    total_items,
    sous_total,
    rabais,
    frais_livraison,
    total,
    code_promo
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // État initial
      items: [],
      summary: {
        total_items: 0,
        sous_total: 0,
        rabais: 0,
        frais_livraison: 0,
        total: 0,
        code_promo: ''
      },

      // Actions
      addItem: (newItem) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          item => item.produit_id === newItem.produit_id && 
          JSON.stringify(item.accompagnants.sort()) === JSON.stringify(newItem.accompagnants.sort())
        );

        let updatedItems: CartItem[];
        
        if (existingItemIndex >= 0) {
          // Item existe déjà, augmenter la quantité
          updatedItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantite: item.quantite + newItem.quantite }
              : item
          );
        } else {
          // Nouvel item
          const itemWithId: CartItem = {
            ...newItem,
            id: `${newItem.produit_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
          updatedItems = [...items, itemWithId];
        }

        const summary = calculateSummary(updatedItems, get().summary.code_promo);
        
        set({ items: updatedItems, summary });
      },

      removeItem: (itemId) => {
        const { items } = get();
        const updatedItems = items.filter(item => item.id !== itemId);
        const summary = calculateSummary(updatedItems, get().summary.code_promo);
        
        set({ items: updatedItems, summary });
      },

      updateQuantity: (itemId, quantite) => {
        if (quantite <= 0) {
          get().removeItem(itemId);
          return;
        }

        const { items } = get();
        const updatedItems = items.map(item =>
          item.id === itemId
            ? { ...item, quantite }
            : item
        );
        const summary = calculateSummary(updatedItems, get().summary.code_promo);
        
        set({ items: updatedItems, summary });
      },

      clearCart: () => {
        set({
          items: [],
          summary: {
            total_items: 0,
            sous_total: 0,
            rabais: 0,
            frais_livraison: 0,
            total: 0,
            code_promo: ''
          }
        });
      },

      updateAccompagnants: (itemId, accompagnants) => {
        const { items } = get();
        const updatedItems = items.map(item =>
          item.id === itemId
            ? { ...item, accompagnants }
            : item
        );
        const summary = calculateSummary(updatedItems, get().summary.code_promo);
        
        set({ items: updatedItems, summary });
      },

      applyPromoCode: (code) => {
        const { items } = get();
        const summary = calculateSummary(items, code);
        
        set({ summary });
      },

      // Getters
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantite, 0);
      },

      getTotalPrice: () => {
        return get().summary.total;
      },

      getItemsByRestaurant: (restaurantId) => {
        return get().items.filter(item => item.restaurant_id === restaurantId);
      },
      
      // Recalcul
      recalculateSummary: () => {
        const { items, summary } = get();
        const newSummary = calculateSummary(items, summary.code_promo);
        set({ summary: newSummary });
      }
    }),
    {
      name: 'bridge-plus-cart',
      // Persister seulement les items et le code promo
      partialize: (state) => ({
        items: state.items,
        code_promo: state.summary.code_promo
      }),
      // Recalculer le summary après la restauration du localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const summary = calculateSummary(state.items, state.summary.code_promo);
          state.summary = summary;
        }
      }
    }
  )
);
