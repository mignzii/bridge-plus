"use client"
import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, User, Star, MapPin, Clock, ChevronLeft, ChevronRight, Phone, MapPinIcon, TimerIcon, Minus, Plus, Trash2, Tag, CreditCard, ArrowRight, UserCircle2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRestaurants } from '../api/restaurants';
import { getProduits } from '../api/produits';
import { getCartWithItems, getPanier } from '../api/panier';
import { getCategories } from '../api/categories';
import Image from 'next/image';
import orange from '@/assets/orange.png';
import wave from '@/assets/wave.jpg';
import yas from '@/assets/yas.png';
type Restaurant = {
  id:string;
  nom_restaurant: string;
  image: string;
  statut: string;
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

type Categorie = {
    id:string;
    nom_categorie: string;
}

const BridgePlusApp = () => {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [panier , setPanier] = useState<Panier | any>(null);
    const [showPanier, setShowPanier] = useState(false);
    const [PanierItems, setPanierItems] = useState<PanierItem[]>([]);
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [categories, setCategories] = useState<Categorie[]>([]);
    const [selectedPayment, setSelectedPayment] = useState('wave');
    const [showDropdown, setShowDropdown] = useState(false);
    const SenegalFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 60 40">
    <rect width="20" height="40" x="0" y="0" fill="#00853F"/>   {/* Vert */}
    <rect width="20" height="40" x="20" y="0" fill="#FDEF42"/>  {/* Jaune */}
    <rect width="20" height="40" x="40" y="0" fill="#E31B23"/>  {/* Rouge */}
    <polygon points="30,12 32.6,20 41,20 34,25 36.5,33 30,28 23.5,33 26,25 19,20 27.4,20" fill="#00853F"/>
  </svg>
);

   
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
    
  const [produits, setProduits] = useState<Produit[]>([]);
  const getRestaurantName = (id: string) => {
  const restaurant = restaurants.find(r => r.id === id);
  return restaurant ? restaurant.nom_restaurant : "Restaurant inconnu";
  };
  const getCategorieNom = (id: string) => {
  const cat = categories.find(c => c.id === id);
  return cat ? cat.nom_categorie : "Catégorie inconnue";
};
  const getRestaurantStatut = (id:string) =>{
    const restaurant = restaurants.find(r => r.id === id);
    return restaurant ? restaurant.statut : "inconnu"
  }
  const getRestaurantImage = (id:string) =>{
    const restaurant = restaurants.find(r => r.id === id);
    return restaurant ? restaurant.image : "inconnu"
  }
  

  const fetchRestaurant = async () =>{
    try{
      const data = await getRestaurants();
      setRestaurants(data || [])
    }catch(error:any){
      console.error("Erreur lors des chargements des restaurants : ", error)
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

  const fetchCategories = async () => {
  try {
    const data = await getCategories(); 
    setCategories(data || []);
  } catch (error) {
    console.error("Erreur lors du chargement des catégories :", error);
  }
};

  useEffect(()=>{
    const recuperationFetch = async()=>{
      try{
        await Promise.all([
          fetchRestaurant(),
          fetchProduits(),
          fetchCategories()
        ]);
      }catch(error:any){
        console.log("Erreur lors de l'initialisation")
      }
    };
    recuperationFetch();
  }, [])

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center ml-6">
              <h1 className="text-2xl italic font-extrabold text-[#eb061d]">Bridge+</h1>
            </div>
            {/* Navigation */}
                        <nav className="hidden md:flex space-x-8">
                          <button className="text-gray-700 hover:text-red-600 font-medium">
                            Commander
                          </button>
                        </nav>
            
                        {/* Search Bar */}
                        <div className="flex-1 max-w-md mx-8">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              placeholder="Rechercher un produit..."
                              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                        </div>
           <div className="flex items-center space-x-4">
              {/* Container relatif pour le panier avec badge */}
              <div className="relative">
                <div onClick={()=>setShowPanier(!showPanier)} className="text-gray-600 hover:text-red-600 cursor-pointer">
                  <ShoppingCart className="w-6 h-6" />
                  {/* Badge du compteur repositionné */}
                  {PanierItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {PanierItems.length}
                    </span>
                  )}
                </div>

                {/* Dropdown du panier */}
                {showPanier && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg w-96 max-h-96 overflow-y-auto z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                        Votre Panier
                      </h3>
                      
                      {PanierItems.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Votre panier est vide</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <p>Total des articles : {PanierItems.length}</p>
                          </div>
                          {PanierItems.map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <img src={item.image} className="w-10 h-10 rounded-md object-cover" alt="" />
                                <div>
                                  <h4 className="font-medium text-gray-800 truncate">
                                    {item.produit_nom}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Quantité: {item.quantite}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right ml-3">
                                <span className="font-semibold text-gray-800">
                                  {item.prix_unitaire}FCFA
                                </span>
                              </div>
                            </div>
                          ))}
                          
                          {/* Total */}
                          {panier && (
                            <div className="border-t pt-3 mt-4">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800">Total:</span>
                                <span className="font-bold text-lg text-gray-800">
                                  {panier.sous_total}FCFA
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="flex gap-2 mt-4 pt-3 border-t">
                            <button onClick={()=> router.push('./panier')} className="flex-1 bg-gradient-to-br from-red-700 to-red-500 text-white py-2  rounded-2xl hover:bg-red-600 transition-colors">
                              voir mon panier
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button className="text-gray-600 hover:text-red-600">
                <UserCircle2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paiement</h1>
          <div className="flex items-center text-gray-600 mt-2">
            <span>Panier</span>
            <ChevronDown className="w-4 h-4 mx-2" />
            <span>Paiement</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Form */}
          <div className="space-y-6">
            {/* Pour qui */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pour qui
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Moi
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Prénom et Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom et Nom
              </label>
              <input
                type="text"
                placeholder="Entrez votre nom et prénom"
                className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-3 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <div className="flex">
                <div className="flex items-center bg-gray-100 border border-gray-300 rounded-l-full px-3 py-3">
                  <div className="w-6 h-4 mr-2 mx-2 mb-4"><SenegalFlag/></div>
                  <span className="text-gray-600 text-sm mx-2">+221</span>
                </div>
                <input
                  type="tel"
                  className="flex-1 bg-gray-100 border border-gray-300 border-l-0 rounded-r-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className='border-b border-gray-200 mb-2' ></div>

            {/* Choisir un moyen de paiement */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Choisir un moyen de paiement
              </h3>
              <div className="">
                {/* Wave */}
                <label className="flex items-center justify-between bg-gray-200 rounded-t-lg p-4 cursor-pointer hover:border-blue-400">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3">
                      <Image src={wave} alt='wave' width={60} height={60} className='rounded-xl w-full h-full object-cover' />
                    </div>
                    <span className="font-medium text-gray-900">Wave</span>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    value="wave"
                    checked={selectedPayment === 'wave'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {/* Orange Money */}
                <label className="flex items-center justify-between bg-gray-200 border border-gray-300  p-4 cursor-pointer hover:border-blue-400">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mr-3">
                       <Image src={orange} alt='orange' width={60} height={60} className='rounded-xl w-full h-full object-cover'/>
                    </div>
                    <span className="font-medium text-gray-900">Orange Money</span>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    value="orange"
                    checked={selectedPayment === 'orange'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {/* Yas Money */}
                <label className="flex items-center justify-between bg-gray-200 border border-gray-300 rounded-b-lg p-4 cursor-pointer hover:border-blue-400">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center mr-3">
                       <Image src={yas} alt='yas' width={60} height={60} className='rounded-xl w-full h-full object-cover'/>
                    </div>
                    <span className="font-medium text-gray-900">Yas Money</span>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    value="yas"
                    checked={selectedPayment === 'yas'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Payer Button */}
            <button className="w-full bg-black text-white py-4 rounded-full font-medium flex items-center justify-center hover:bg-gray-800 transition-colors">
              <span>Payer</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Somme Commande
            </h2>

            {
            panier &&(
                <>
                <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span>Sous total</span>
              <span className="font-medium">FCFA {panier.sous_total}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Rabais (-20%)</span>
              <span className="font-medium  text-red-600">-{panier.rabais}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Frais de Livraison</span>
              <span className="font-medium">FCFA {panier.frais_livraison}</span>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>FCFA {panier.total}</span>
              </div>
            </div>
          </div>
                </>
            )
          }
          </div>
        </div>
      </div>
    </div>
      </section>

      

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
              <a onClick={()=>router.push("./commander")} className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium cursor-pointer">Commander</a>
              <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Réservation</a>
               <a href="https://www.mafalia.com/" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium cursor-pointer">Mafalia</a>
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

export default BridgePlusApp;