"use client"
import React, { useEffect, useState, useRef } from 'react';
import { Search, ShoppingCart, Settings, Star, ChevronRight, UserCircle2, Minus, Plus, Menu, X } from 'lucide-react';
import { getCategories } from '../api/categories';
import { getProduits } from '../api/produits';
import { getRestaurants } from '../api/restaurants';
import { clearCart, createPanier, getCartWithItems, getPanier, updatePanier } from '../api/panier';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Categorie = {
  id:string;
  nom_categorie: string;
}

type Panier = {
id: string;
sous_total: number;
rabais: number;
total: number;
code_promo: string;
total_items: number;
frais_livraison: number;
}

type PanierItem = {
  id: string;
  produit_id: string;
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
  image: string;
  accompagnant: string;
  categorie_id: string;
}

type Restaurant = {
  id:string;
  nom_restaurant: string;
  image: string;
  statut: string;
}

type ModalProps = {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

type Produit = {
  id: string;
  nom_produit: string;
  image: string;
  description: string;
  prix: number;
  accompagnants: string[];
  note: number;
  restaurant_id: string;
  categorie_id: string;
}

const FoodLoadingAnimation = () => {
  const foodEmojis = ['🍕', '🍔', '🍟', '🌮', '🍜', '🍱', '🥗', '🍰', '🥘'];
  
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-20">
      <div className="relative">
        <div className="animate-spin w-16 h-16 sm:w-24 sm:h-24 relative">
          {foodEmojis.map((emoji, index) => (
            <div
              key={index}
              className="absolute text-lg sm:text-2xl animate-bounce"
              style={{
                transform: `rotate(${index * 40}deg) translateY(-30px)`,
                animationDelay: `${index * 0.2}s`,
                transformOrigin: '8px 30px'
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center text-2xl sm:text-4xl animate-pulse">
          👨‍🍳
        </div>
      </div>
      
      <div className="mt-6 sm:mt-8 text-center">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 animate-pulse">
          Préparation de vos délices...
        </h3>
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ show, onClose, children }: ModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

const RestaurantPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorie, setCategorie] = useState<Categorie[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showPanier, setShowPanier] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [panier , setPanier] = useState<any>(null);
  const [PanierItems, setPanierItems] = useState([])
  const [produits, setProduits] = useState<Produit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const[isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedAccompagnants, setSelectedAccompagnants] = useState<Record<string, string[]>>({});
  const panierRef = useRef<HTMLDivElement>(null);

  const produitsFiltres = selectedCategory ? produits.filter((p)=>p.categorie_id === selectedCategory):produits;
    
  const notifyCartUpdate = () => {
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const incrementQuantity = (productId: string) => {
    setQuantities(prev => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
  };

  const decrementQuantity = (productId: string) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(0, current - 1); 
      return { ...prev, [productId]: next };
    });
  };

  const toggleAccompagnant = (productId: string, accompagnant: string) => {
    setSelectedAccompagnants(prev => {
      const currentSelection = prev[productId] || [];
      const isSelected = currentSelection.includes(accompagnant);
      
      if (isSelected) {
        return {
          ...prev,
          [productId]: currentSelection.filter(item => item !== accompagnant)
        };
      } else {
        return {
          ...prev,
          [productId]: [...currentSelection, accompagnant]
        };
      }
    });
  };

  const ajouterAuPanier = async (produit: Produit) => {
    const quantite = quantities[produit.id] || 1;
    const accompagnantsSelectionnes = selectedAccompagnants[produit.id] || [];
    
    console.log("🔍 Debug - Produit complet:", produit);
    
    if (quantite <= 0) {
      setMessage({ type: "error", text: "Veuillez sélectionner une quantité" });
      return;
    }
  
    console.log("✅ Données validées:", {
      produitId: produit.id,
      produitNom: produit.nom_produit,
      quantite,
      prix: produit.prix,
      accompagnants: accompagnantsSelectionnes
    });
  
    const totalProduit = produit.prix * quantite;
    const localRabais = totalProduit * 0.2;
    try {
  
      if (panier) {
        console.log("✅ Panier existant:", panier.id);
        let { data: itemExistant, error: itemError } = await supabase
          .from('panier_item')
          .select('*')
          .eq('panier_id', panier.id)
          .eq('produit_id', produit.id)
          .single();
  
        if (itemError && itemError.code !== 'PGRST116') {
          throw itemError;
        }
  
        if (itemExistant) {
          console.log("🔄 Mise à jour item existant...");
          const { error: updateError } = await supabase
            .from('panier_item')
            .update({
              quantite: itemExistant.quantite + quantite,
              accompagnant: JSON.stringify(accompagnantsSelectionnes)
            })
            .eq('id', itemExistant.id);
            
          if (updateError) throw updateError;
          
        } else {
          console.log("➕ Ajout nouvel item...");
          const { error: insertError } = await supabase
            .from('panier_item')
            .insert([{
              panier_id: panier.id,
              produit_id: produit.id,
              produit_nom: produit.nom_produit,
              prix_unitaire:  parseFloat(produit.prix),
              quantite,
              image: produit.image,
              categorie_id: produit.categorie_id,
              accompagnant: JSON.stringify(accompagnantsSelectionnes)
            }]);
            
          if (insertError) throw insertError;
        }
         const nouveauSousTotal = (panier.sous_total || 0) + totalProduit;
          const nouveauTotalItems = (panier.total_items || 0) + quantite;
          const nouveauRabais = nouveauSousTotal * 0.2; 
          const nouveauTotal = nouveauSousTotal - nouveauRabais + (panier.frais_livraison || 0);

      await updatePanier(panier.id, {
        sous_total: nouveauSousTotal,
        total_items: nouveauTotalItems,
        rabais: nouveauRabais,
        total: nouveauTotal
      });
  
      } else {
        console.log("🆕 Création nouveau panier...");
        const nouveauPanier = await createPanier({
        sous_total: totalProduit,
        rabais: localRabais,
        code_promo: null,
        frais_livraison: 2000,
        total_items: quantite,
        total: totalProduit + 2000 - localRabais
      });

  
        console.log("✅ Nouveau panier créé:", nouveauPanier.id);
  
        const { error: itemError } = await supabase
          .from('panier_item')
          .insert([{
          panier_id: nouveauPanier.id,
          produit_id: produit.id,
          produit_nom: produit.nom_produit,
          prix_unitaire: produit.prix,
          quantite,
          image: produit.image,
          categorie_id: produit.categorie_id,
          accompagnant: JSON.stringify(accompagnantsSelectionnes)
          }]);
  
        if (itemError) throw itemError;
        const cartWithItems = await getCartWithItems(nouveauPanier.id);
        setPanier(cartWithItems);
        setPanierItems(cartWithItems?.panier_item ?? []);
        console.log("✅ Item ajouté au nouveau panier");
      }
  
      setMessage({ type: "success", text: `${produit.nom_produit} ajouté au panier !` });
      setQuantities(prev => ({ ...prev, [produit.id]: 0 }));
      setSelectedAccompagnants(prev => ({ ...prev, [produit.id]: [] }));
      
      setShowModal(false);
      setSelectedProduct(null);
      
      notifyCartUpdate();
  
    } catch (error: any) {
      console.error("❌ Erreur complète:", error);
      setMessage({ 
        type: "error", 
        text: "Erreur lors de l'ajout au panier: " + (error?.message || "Erreur inconnue") 
      });
    }
  };

  const getRestaurantName = (id: string) => {
    const restaurant = restaurants.find(r => r.id === id);
    return restaurant ? restaurant.nom_restaurant : "Restaurant inconnu";
  };

  const getRestaurantStatut = (id:string) =>{
    const restaurant = restaurants.find(r => r.id === id);
    return restaurant ? restaurant.statut : "inconnu"
  }

  const getRestaurantImage = (id:string) =>{
    const restaurant = restaurants.find(r => r.id === id);
    return restaurant ? restaurant.image : "inconnu"
  }

  const fecthCategorie = async () =>{
    try{
      const data = await getCategories();
      setCategorie(data || [])
    }catch(error:any){
      console.error("Erreur lors des chargements des categories : ", error)
    }
  }

  const fetchProduits = async () =>{
      try{
        const data = await getProduits();
        setProduits(data || [])
      }catch(error:any){
        console.error("Erreur lors des chargements des restaurants : ", error)
      }
  }

  const fetchRestaurant = async () =>{
      try{
        const data = await getRestaurants();
        setRestaurants(data || [])
      }catch(error:any){
        console.error("Erreur lors des chargements des restaurants : ", error)
      }
    }

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panierRef.current && !panierRef.current.contains(event.target as Node)) {
        setShowPanier(false);
      }
    };

    if (showPanier) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanier]);
  

  useEffect (()=>{
    const fetchCart = async () =>{
      try{
        const carts = await getPanier();
        if(carts.length === 0){
          setPanier(null);
          setPanierItems([]);
          return;
        }
        
         const panierId = carts[0].id; 
        const cartWithItem = await getCartWithItems(panierId);
        setPanier(cartWithItem || null);
        setPanierItems(cartWithItem.panier_item || [])
      }catch (error) {
      console.error("Erreur lors de la récupération du panier :", error);
      setPanier(null);
      setPanierItems([]);
    }
    };
    fetchCart();
    const handleCartUpdate = () => {
    fetchCart();
    
  };
  window.addEventListener("cartUpdated", handleCartUpdate);

  return () =>{
    window.removeEventListener("cartUpdated", handleCartUpdate);
  };
  
  }, [])
  

  useEffect(()=>{
    const recuperationFetch = async()=>{
      setIsLoading(true);
      try{
        await Promise.all([
          fetchRestaurant(),
          fetchProduits(),
          fecthCategorie()
        ]);
      }catch(error:any){
        console.log("Erreur lors de l'initialisation")
      }finally {
      setIsLoading(false); 
    }
    };
    recuperationFetch();
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div onClick={()=>router.push("./")} className="flex items-center cursor-pointer">
              <span className="text-xl sm:text-2xl font-bold text-red-600">Bridge</span>
              <span className="text-xl sm:text-2xl font-bold text-red-600">+</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button className="text-gray-700 hover:text-red-600 font-medium">
                Commander
              </button>
            </nav>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart Icon */}
              <div className='relative' ref={panierRef}>
                <div onClick={()=>setShowPanier(!showPanier)} className="text-gray-600 hover:text-red-600 cursor-pointer">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {PanierItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-medium text-[10px] sm:text-xs">
                      {PanierItems.length}
                    </span>
                  )}
                </div>
                
                {showPanier && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg w-80 sm:w-96 max-h-80 sm:max-h-96 overflow-y-auto z-50">
                  <div className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                      Votre Panier
                    </h3>
                    
                    {PanierItems.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Votre panier est vide</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm">Total des articles : {PanierItems.length}</p>
                        </div>
                        {PanierItems.map((item: any) => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <img src={item.image} className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0 mr-2 sm:mr-3" alt="" />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-800 truncate text-sm">
                                  {item.produit_nom}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  Quantité: {item.quantite}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2 flex-shrink-0">
                              <span className="font-semibold text-gray-800 text-sm">
                                {item.prix_unitaire}FCFA
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total */}
                        <div className="border-t pt-3 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800 text-sm">Total:</span>
                            <span className="font-bold text-base sm:text-lg text-gray-800">
                              {panier.sous_total}FCFA
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <button onClick={()=> router.push('./panier')} className="flex-1 bg-gradient-to-br from-red-700 to-red-500 text-white py-2 rounded-2xl hover:bg-red-600 transition-colors text-sm">
                            voir mon panier
                          </button>
                          <button className="flex-1 bg-gradient-to-br from-gray-500 to-gray-400 text-white py-2 rounded-2xl hover:bg-red-600 transition-colors text-sm">
                            vider le panier
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

              {/* User Icon */}
              <button className="text-gray-600 hover:text-red-600 hidden sm:block">
                <UserCircle2 className="w-6 h-6" />
              </button>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-1"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden py-4 border-t">
              <div className="space-y-4">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
                {/* Mobile Navigation Links */}
                <div className="flex flex-col space-y-2">
                  <button className="text-left text-gray-700 hover:text-red-600 font-medium py-2 text-sm">Commander</button>
                  <button className="text-left text-gray-700 hover:text-red-600 font-medium py-2 text-sm">Profile</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 bg-white rounded-2xl border border-gray-300 shadow-md p-6 h-fit">
            <h2 className="text-lg font-semibold border-b text-gray-900 mb-6">Catégories</h2>
            <div className="space-y-2">
              {categorie.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between p-1 text-left rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium">{category.nom_categorie}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
            
            <div className="mt-8 pt-2 border-t border-gray-200">
              <button className="text-sm bg-gray-100 px-4 py-3 rounded-full font-medium">
                Voir toutes les catégories
              </button>
            </div>
          </div>

          {/* Mobile Categories Button */}
          <div className="lg:hidden mb-4">
            <button 
              onClick={() => setShowCategoriesModal(true)}
              className="w-full bg-white rounded-xl border border-gray-300 shadow-md p-4 flex items-center justify-between"
            >
              <span className="text-sm font-medium text-gray-900">
                {selectedCategory ? categorie.find((c) => c.id === selectedCategory)?.nom_categorie
                  : "Toutes les catégories"}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {isLoading ? (<FoodLoadingAnimation/>) : (
              <>
                {/* Menu Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {produitsFiltres.slice(0, 9).map((product) => (
                    <div 
                      onClick={()=>{setShowModal(true), setSelectedProduct(product)}} 
                      key={product.id} 
                      className="bg-white rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105"
                    >
                      <div className="relative">
                        <div className="h-40 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <img src={product.image} alt={product.nom_produit} className='w-full h-full object-cover'/>
                        </div>
                        {getRestaurantStatut(product.restaurant_id) === "ouvert" && (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Ouvert
                          </div>
                        )}
                        {getRestaurantStatut(product.restaurant_id) === "ferme" && (
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                            Fermé
                          </div>
                        )}
                        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1 sm:space-x-2">
                          <img 
                            src={getRestaurantImage(product.restaurant_id)} 
                            alt="image" 
                            className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <span className="truncate max-w-16 sm:max-w-20">{getRestaurantName(product.restaurant_id)}</span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center flex-wrap">
                          <h3 className="font-extrabold text-sm sm:text-md mr-2 text-gray-900 flex-1 min-w-0 truncate">{product.nom_produit}</h3>
                          <div className="flex items-center flex-shrink-0">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-extrabold ml-1">{product.note}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-base sm:text-lg font-extrabold text-gray-900">FCFA {product.prix}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* View All Button */}
            <div className="text-center mt-8 sm:mt-12">
              <button className="px-8 sm:px-10 py-2 border border-black rounded-full hover:bg-gray-50 font-medium transition-colors text-sm sm:text-base">
                Voir Tout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Modal for Mobile */}
      <Modal show={showCategoriesModal} onClose={() => setShowCategoriesModal(false)}>
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Catégories</h2>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedCategory('');
                setShowCategoriesModal(false);
              }}
              className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${
                selectedCategory === ''
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="font-medium">Toutes les catégories</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            {categorie.map((category, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setShowCategoriesModal(false);
                }}
                className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="font-medium">{category.nom_categorie}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        {selectedProduct && (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 max-w-6xl">
            {/* Image */}
            <div className="w-full lg:w-1/2 bg-gray-100 relative overflow-hidden rounded-lg">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.nom_produit} 
                className="w-full h-48 sm:h-64 lg:h-96 object-cover"
              />
            </div>

            {/* Informations */}
            <div className="w-full lg:w-1/2 flex flex-col">
              {/* Titre */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{selectedProduct.nom_produit}</h2>
              
              {/* Badge restaurant et note */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-white px-3 py-2 rounded-full text-sm">
                  <img 
                    src={getRestaurantImage(selectedProduct.restaurant_id)} 
                    alt="restaurant" 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <p className='font-bold text-gray-900 text-sm sm:text-base'>{getRestaurantName(selectedProduct.restaurant_id)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm sm:text-base">{selectedProduct.note}</span>
                </div>
              </div>

              {/* Prix */}
              <div className="mb-4">
                <span className="text-xl sm:text-2xl font-medium text-gray-900">FCFA {selectedProduct.prix}</span>
              </div>

              {/* Description */}
              <p className="text-gray-500 font-medium text-sm sm:text-base leading-relaxed mb-4 sm:mb-6 flex-1">
                {selectedProduct.description}
              </p>

              <div className='border-b border-gray-300'></div>

              {/* Choix Accompagnement */}
              <div className="mb-4 sm:mb-6">
                <h3 className="font-medium text-gray-500 mt-4 sm:mt-6 text-sm sm:text-base">Choix Accompagnement</h3>
                
                <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
                  {selectedProduct.accompagnants.map((accompagnant, index) => {
                    const isSelected = selectedAccompagnants[selectedProduct.id]?.includes(accompagnant);
                    return (
                      <button 
                        key={index}
                        onClick={() => toggleAccompagnant(selectedProduct.id, accompagnant)}
                        className={`px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-colors ${
                          isSelected 
                            ? 'bg-black text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {accompagnant}
                      </button>
                    );
                  })}
                </div>
                
                {/* Affichage des accompagnants sélectionnés */}
                {selectedAccompagnants[selectedProduct.id]?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      Sélectionnés: {selectedAccompagnants[selectedProduct.id].join(', ')}
                    </p>
                  </div>
                )}
              </div>
              <div className='border-b border-gray-300'></div>

              {/* Quantité et bouton */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 sm:mt-6 gap-4">
                {/* Contrôles quantité */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-7 py-2 rounded-full bg-gray-200 hover:bg-gray-50 transition-colors">
                    <button onClick={()=>decrementQuantity(selectedProduct.id)}>
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="text-base sm:text-lg font-semibold min-w-[2rem] text-center">
                      {quantities[selectedProduct.id] ?? 1}
                    </span>
                    <button onClick={()=>incrementQuantity(selectedProduct.id)}>
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Bouton ajouter */}
                <button 
                  onClick={()=>ajouterAuPanier(selectedProduct)} 
                  className="bg-black text-white px-6 sm:px-8 lg:px-10 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto"
                >
                  Ajouter au panier
                </button>
              </div>
              
              {/* Message de confirmation/erreur */}
              {message.text && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      {/* Footer */}
     <footer className="bg-red-50 py-6 sm:py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl xl:text-8xl italic font-extrabold text-[#eb061d] mb-2 sm:mb-4">Bridge+</h2>
            <p className="text-lg sm:text-xl font-semibold text-gray-800">Commande Rapide et Sécurisée</p>
          </div>
          
          {/* Navigation Links and Social Media Icons */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-4 sm:mb-8 space-y-6 lg:space-y-0 mx-4 sm:mx-10">
            {/* Navigation Links */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-7 text-center sm:text-left">
              <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">À propos</a>
              <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Commander</a>
              <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Réservation</a>
              <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Mafalia</a>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex gap-4 space-x-2">
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
              </div>
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className='border-b border-gray-200'></div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm mt-3">© Copyright BridgePlus, 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RestaurantPage;