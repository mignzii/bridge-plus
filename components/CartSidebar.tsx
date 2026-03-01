"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, MapPin } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const {
    items,
    summary,
    itemCount,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    getItemsGroupedByRestaurant
  } = useCart();

  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});

  // Fonction pour récupérer les noms des restaurants
  const fetchRestaurantNames = async () => {
    if (items.length === 0) return;
    
    const restaurantIds = Array.from(new Set(items.map(item => item.restaurant_id)));
    
    try {
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, nom_restaurant')
        .in('id', restaurantIds);
      
      if (error) {
        console.error('Erreur lors de la récupération des restaurants:', error);
        return;
      }
      
      const namesMap: Record<string, string> = {};
      restaurants?.forEach(restaurant => {
        namesMap[restaurant.id] = restaurant.nom_restaurant || 'Restaurant inconnu';
      });
      
      setRestaurantNames(namesMap);
    } catch (error) {
      console.error('Erreur lors de la récupération des restaurants:', error);
    }
  };

  // Récupérer les noms des restaurants quand les items changent
  useEffect(() => {
    fetchRestaurantNames();
  }, [items]);

  if (!isOpen) return null;

  const groupedItems = getItemsGroupedByRestaurant();

  const handleCheckout = () => {
    onClose();
    router.push('/paiement');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Panier ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Votre panier est vide</p>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              <div className="flex-1 p-4 space-y-4">
                {Object.entries(groupedItems).map(([restaurantId, restaurantItems]) => (
                  <div key={restaurantId} className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <h3 className="font-medium text-gray-900">
                        {restaurantNames[restaurantId] || `Restaurant ${restaurantId.slice(0, 8)}...`}
                      </h3>
                      <span className="text-xs text-gray-500">
                        ({restaurantItems.length})
                      </span>
                    </div>
                    {restaurantItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={item.image}
                          alt={item.produit_nom}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.produit_nom}</h4>
                          <p className="text-xs text-gray-500">
                            {item.prix_unitaire} FCFA
                          </p>
                          {item.accompagnants.length > 0 && (
                            <p className="text-xs text-gray-400">
                              + {item.accompagnants.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decrementQuantity(item.produit_id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantite}
                          </span>
                          <button
                            onClick={() => incrementQuantity(item.produit_id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.produit_id)}
                            className="p-1 hover:bg-red-100 text-red-500 rounded ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t p-4 space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{summary.sous_total} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Réduction</span>
                    <span className="text-green-600">-{summary.rabais} FCFA</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Sous-total</span>
                    <span>{summary.total} FCFA</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                    <p className="text-xs text-green-700 flex items-center gap-1">
                      <span>🚚</span>
                      <span>Les frais de livraison seront calculés à l'étape suivante</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#16a34a] text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Commander ({summary.total} FCFA)
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Vider le panier
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
