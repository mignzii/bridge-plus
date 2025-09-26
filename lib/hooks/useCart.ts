import { useCartStore, CartItem } from '@/lib/stores/cartStore';
import { useCallback } from 'react';

export const useCart = () => {
  const {
    items,
    summary,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    updateAccompagnants,
    applyPromoCode,
    getItemCount,
    getTotalPrice,
    getItemsByRestaurant,
    recalculateSummary
  } = useCartStore();

  // Fonction pour ajouter un produit au panier
  const addToCart = useCallback((product: {
    produit_id: string;
    produit_nom: string;
    prix_unitaire: number;
    image: string;
    categorie_id: string;
    restaurant_id: string;
    accompagnants?: string[];
  }, quantite: number = 1) => {
    addItem({
      produit_id: product.produit_id,
      produit_nom: product.produit_nom,
      prix_unitaire: product.prix_unitaire,
      image: product.image,
      categorie_id: product.categorie_id,
      restaurant_id: product.restaurant_id,
      quantite,
      accompagnants: product.accompagnants || []
    });
  }, [addItem]);

  // Fonction pour incrémenter la quantité d'un produit
  const incrementQuantityByProductId = useCallback((produitId: string) => {
    const item = items.find(item => item.produit_id === produitId);
    if (item) {
      updateQuantity(item.id, item.quantite + 1);
    }
  }, [items, updateQuantity]);

  // Fonction pour décrémenter la quantité d'un produit
  const decrementQuantityByProductId = useCallback((produitId: string) => {
    const item = items.find(item => item.produit_id === produitId);
    if (item) {
      updateQuantity(item.id, item.quantite - 1);
    }
  }, [items, updateQuantity]);

  // Fonction pour obtenir la quantité d'un produit spécifique
  const getProductQuantity = useCallback((produitId: string) => {
    const item = items.find(item => item.produit_id === produitId);
    return item ? item.quantite : 0;
  }, [items]);

  // Fonction pour vérifier si un produit est dans le panier
  const isInCart = useCallback((produitId: string) => {
    return items.some(item => item.produit_id === produitId);
  }, [items]);

  // Fonction pour obtenir les items groupés par restaurant
  const getItemsGroupedByRestaurant = useCallback(() => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.restaurant_id]) {
        acc[item.restaurant_id] = [];
      }
      acc[item.restaurant_id].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    return grouped;
  }, [items]);

  // Fonction pour calculer le total par restaurant
  const getTotalByRestaurant = useCallback((restaurantId: string) => {
    const restaurantItems = getItemsByRestaurant(restaurantId);
    return restaurantItems.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
  }, [getItemsByRestaurant]);

  // Fonction pour obtenir le nombre d'items par restaurant
  const getItemCountByRestaurant = useCallback((restaurantId: string) => {
    const restaurantItems = getItemsByRestaurant(restaurantId);
    return restaurantItems.reduce((sum, item) => sum + item.quantite, 0);
  }, [getItemsByRestaurant]);

  return {
    // État
    items,
    summary,
    itemCount: getItemCount(),
    totalPrice: getTotalPrice(),
    
    // Actions
    addToCart,
    removeItem,
    updateQuantity,
    incrementQuantity: incrementQuantityByProductId,
    decrementQuantity: decrementQuantityByProductId,
    clearCart,
    updateAccompagnants,
    applyPromoCode,
    recalculateSummary,
    
    // Getters
    getProductQuantity,
    isInCart,
    getItemsByRestaurant,
    getItemsGroupedByRestaurant,
    getTotalByRestaurant,
    getItemCountByRestaurant
  };
};
