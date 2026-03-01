"use client"
import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, User, Star, MapPin, Clock, ChevronLeft, ChevronRight, Phone, MapPinIcon, TimerIcon, Minus, Plus, Trash2, Tag, CreditCard, ArrowRight, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { supabase } from '@/lib/supabaseClient';

const BridgePlusApp = () => {
    const router = useRouter();
  const { items, summary, updateQuantity, removeItem, clearCart, recalculateSummary } = useCart();
  const [code_promo, setCodePromo] = useState('');
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
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

  // Recalculer le summary au montage pour éviter les montants à 0
  useEffect(() => {
    if (items.length > 0 && summary.total === 0) {
      console.log('🔄 Recalcul du summary car total = 0');
      recalculateSummary();
    }
  }, [items, summary.total, recalculateSummary]);

  // Récupérer les noms des restaurants quand les items changent
  useEffect(() => {
    fetchRestaurantNames();
  }, [items]);

  // Debug - pour voir si le store se met à jour
  console.log('🛒 Panier Debug:', {
    items: items.length,
    summary: summary,
    totalItems: summary.total_items
  });

  const incrementQuantity = (itemId: string, currentQuantity: number) => {
    updateQuantity(itemId, currentQuantity + 1);
  };

  const decrementQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    }
  };

  const clearCartHandler = () => {
    try {
      clearCart();
    setMessage({ type: "success", text: "Panier vidé avec succès !" });
  } catch (err: any) {
    console.error("Erreur lors du vidage du panier :", err?.message || err);
    setMessage({ type: "error", text: "Erreur lors du vidage du panier." });
  }
};
    
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2 ml-6 cursor-pointer" onClick={() => router.push('/')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/ajamaat-logo.jpeg" alt="Ajamaat Mobilité" className="h-9 w-9 rounded-full object-cover border-2 border-green-600" />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-extrabold text-green-700 tracking-wide">AJAMAAT</span>
                  <span className="text-[10px] font-semibold text-green-600 tracking-widest -mt-0.5">MOBILITÉ</span>
                </div>
              </div>
              <nav className="hidden md:flex space-x-8">
                <button 
                  onClick={() => router.push('/commander')}
                  className="text-gray-700 hover:text-green-600 font-medium"
                >
                  Commander
                </button>
              </nav>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-600" />
                </div>
                <button className="text-gray-600 hover:text-green-600">
                  <UserCircle2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Votre panier est vide</h2>
          <p className="text-gray-600 mb-8">Découvrez nos délicieux produits et ajoutez-les à votre panier</p>
          <button
            onClick={() => router.push('/commander')}
            className="bg-[#16a34a] text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Commencer mes achats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 ml-6 cursor-pointer" onClick={() => router.push('/')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ajamaat-logo.jpeg" alt="Ajamaat Mobilité" className="h-9 w-9 rounded-full object-cover border-2 border-green-600" />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-extrabold text-green-700 tracking-wide">AJAMAAT</span>
                <span className="text-[10px] font-semibold text-green-600 tracking-widest -mt-0.5">MOBILITÉ</span>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => router.push('/commander')}
                className="text-gray-700 hover:text-green-600 font-medium"
              >
                    Commander
                </button>
            </nav>
            
            <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
            </div>
            </div>

           <div className="flex items-center space-x-4">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-green-600" />
                {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {items.length}
                                </span>
                )}
              </div>
              <button className="text-gray-600 hover:text-green-600">
                <UserCircle2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600"
            >
              <ChevronLeft className="w-5 h-5" />
              Retour
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Mon Panier</h1>
          </div>
          <p className="text-gray-600">{items.length} article{items.length > 1 ? 's' : ''} dans votre panier</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Articles sélectionnés</h2>
              
              <div className="space-y-6">
                {Object.entries(
                  items.reduce((acc, item) => {
                    if (!acc[item.restaurant_id]) {
                      acc[item.restaurant_id] = [];
                    }
                    acc[item.restaurant_id].push(item);
                    return acc;
                  }, {} as Record<string, typeof items>)
                ).map(([restaurantId, restaurantItems]) => (
                  <div key={restaurantId} className="border border-gray-200 rounded-xl p-4">
                    {/* En-tête du restaurant */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">
                        {restaurantNames[restaurantId] || `Restaurant ${restaurantId.slice(0, 8)}...`}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({restaurantItems.length} article{restaurantItems.length > 1 ? 's' : ''})
                      </span>
                    </div>

                    {/* Items du restaurant */}
                    <div className="space-y-3">
                      {restaurantItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <img
            src={item.image}
            alt={item.produit_nom}
                            className="w-16 h-16 object-cover rounded-lg"
          />
      <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.produit_nom}</h4>
                            <p className="text-sm text-gray-600">Prix unitaire: {item.prix_unitaire} FCFA</p>
                            {item.accompagnants && item.accompagnants.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                + {item.accompagnants.join(', ')}
                              </p>
                            )}
      </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => decrementQuantity(item.id, item.quantite)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantite}</span>
                            <button 
                              onClick={() => incrementQuantity(item.id, item.quantite)}
                              className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
          </button>
        </div>

                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {item.prix_unitaire * item.quantite} FCFA
                            </p>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 text-sm mt-1 flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
        </button>
                          </div>
                        </div>
                      ))}
      </div>
    </div>
  ))}
</div>

              {/* Clear Cart Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button 
                  onClick={clearCartHandler}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Vider le panier
                </button>
              </div>
            </div>
        </div>

        {/* Order Summary Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Résumé de la commande</h2>
            
                <div className="space-y-4 mb-6">
            <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-medium">FCFA {summary.sous_total}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Rabais (-20%)</span>
                <span className="font-medium text-green-600">-{summary.rabais} FCFA</span>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Sous-total</span>
                  <span>FCFA {summary.total}</span>
                </div>
              </div>

              {/* Message informatif - Thème Bridge+ */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-green-800">
                  🚚 <strong>Les frais de livraison</strong> seront calculés à l'étape suivante selon votre choix :
                </p>
                <div className="mt-2 text-xs text-green-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span><strong>Retrait gratuit</strong> en magasin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span><strong>Livraison à domicile</strong> (frais selon zone)</span>
                  </div>
                </div>
              </div>
            </div>

          {/* Promo Code Section */}
          <div className="mb-6">
            <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code promo"
                  value={code_promo}
                  onChange={(e) => setCodePromo(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  <Tag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`p-3 rounded-lg mb-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Checkout Button */}
            <button 
              onClick={() => router.push('/paiement')}
              className="w-full bg-gradient-to-br from-green-700 to-green-500 text-white py-4 rounded-xl font-semibold hover:from-green-800 hover:to-green-600 transition-all flex items-center justify-center"
            >
              <span>Procéder au paiement</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>

            <div className="mt-4 text-center">
              <button 
                onClick={() => router.push('/commander')}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Continuer mes achats
              </button>
            </div>
          </div>
        </div>
      </div>

  {/* Footer */}
      <footer className="bg-green-50 py-6 sm:py-8 lg:py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-4 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ajamaat-logo.jpeg" alt="Ajamaat Mobilité" className="h-14 w-14 rounded-full object-cover border-4 border-green-600 shadow-lg" />
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16a34a] leading-none">AJAMAAT</h2>
                <p className="text-lg sm:text-xl font-extrabold text-[#16a34a] tracking-widest">MOBILITÉ</p>
              </div>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-gray-800">Commande Rapide et Sécurisée</p>
          </div>
          
          <div className="flex flex-col lg:flex-row justify-between items-center mb-4 sm:mb-8 space-y-6 lg:space-y-0 mx-4 sm:mx-10">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-7 text-center sm:text-left">
              <a href="#" className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium">À propos</a>
              <a onClick={() => router.push("./commander")} className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium cursor-pointer">Commander</a>
              <a href="#" className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium">Réservation</a>
              <a href="https://www.mafalia.com/" className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium cursor-pointer">Mafalia</a>
            </div>
          </div>
          
          <div className='border-b border-gray-200'></div>
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm mt-3">© Copyright Ajamaat Mobilité, 2025</p>
          </div>
        </div>
      </footer>
  </div>
  );
};

export default BridgePlusApp;