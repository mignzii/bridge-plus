"use client"
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import imagePer from '@/assets/imagePer.png'
import livreur from '@/assets/livreur.png'
import pizza from '@/assets/pizza.png';
import poulet from '@/assets/poulet.png';
import sandwich from '@/assets/sandwich.png';
import Reduction from '@/assets/reduction.png';
import { Search, ShoppingCart, User, Star, MapPin, Clock, ChevronLeft, ChevronRight, Phone, MapPinIcon, TimerIcon, Menu, X, UserCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRestaurants } from './api/restaurants';
import { getProduits } from './api/produits';
import { clearCart, getCartWithItems, getPanier } from './api/panier';
import { createfileAttente } from './api/fileAttente';

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

const BridgePlusApp = () => {
  const [selectedDelivery, setSelectedDelivery] = useState('immediate');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [formData, setFormData] = useState({
    nom_complet: "",
    email: "",
    numeroPhone: "",
    isCondition: false
  })
  const [showPanier, setShowPanier] = useState(false);
  const [panier , setPanier] = useState<any>(null);
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [PanierItems, setPanierItems] = useState([])
  const panierRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
  const [quantities, setQuantities] = useState<Record<string, number>>({});


 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value, type, checked } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value
  }));
};

const handleCreatePerson = async () => {
  if (!formData.nom_complet || !formData.email || !formData.numeroPhone || !formData.isCondition) {
    setMessage({ text: 'Veuillez remplir tous les champs et accepter les conditions.', type: 'error' });
    return;
  }
  setLoading(true);
  setMessage({ text: '', type: '' }); 
  
  try {
    const infoData = {
      nom_complet: formData.nom_complet,
      email: formData.email,
      numeroPhone: formData.numeroPhone,
      isCondition: formData.isCondition
    };
    
    const newPerson = await createfileAttente(infoData);
    console.log('personne ajoutée:', newPerson);
    
    setMessage({ 
      text: '🎉 Félicitations ! Vous avez été inscrit(e) à la file d\'attente. Vous recevrez bientôt votre code promo de 20% !', 
      type: 'success' 
    });
    
    setTimeout(() => {
      setShowReductionModal(false);
    }, 2000);
    
  } catch (error) {
    console.error('Erreur:', error);
    setMessage({ 
      text: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.', 
      type: 'error' 
    });
  } finally {
    setLoading(false);
  }
};

 const clearCartHandler = async () => {
   if (!panier?.id) {
     setMessage({ type: "error", text: "Aucun panier trouvé." });
     return;
   }
   try {
     await clearCart(panier.id);
     setPanier({
       ...panier,
       total_items: 0,
       sous_total: 0,
       rabais: 0,
       frais_livraison: 0,
       total: 0,
     });
     setPanierItems([]);
     setQuantities({});
     setMessage({ type: "success", text: "Panier vidé avec succès !" });
   } catch (err: any) {
     console.error("Erreur lors du vidage du panier :", err?.message || err);
     setMessage({ type: "error", text: "Erreur lors du vidage du panier." });
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

  const testimonials = [
    { id: 1, name: 'Alassane S.', rating: 5, text: 'Je suis très satisfait de la rapidité et de l\'efficacité de Bridge Plus. Les plats sont toujours de bonne qualité et arrivent chauds.' },
    { id: 2, name: 'Moussa K.', rating: 5, text: 'Service impeccable ! L\'application est intuitive et il est facile de trouver des restaurants de qualité. Leur gamme de plats est vraiment impressionnante.' },
    { id: 3, name: 'Fatou L.', rating: 5, text: 'Excellent service ! Je recommande vivement Bridge Plus. Chaque commande arrive à temps et la qualité est constante. Le service client est également très réactif.' },
  ];

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
    const timer = setTimeout(()=>{
      setShowReductionModal(true);
    }, 3000);
    return ()=>clearTimeout(timer);
  }, [])

 
  

  useEffect(()=>{
    const recuperationFetch = async()=>{
      try{
        await Promise.all([
          fetchRestaurant(),
          fetchProduits()
        ]);
      }catch(error:any){
        console.log("Erreur lors de l'initialisation")
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
                    <button onClick={()=>router.push("./commander")} className="text-gray-700 hover:text-red-600 font-medium">
                      Commander
                    </button>
                    <button className="text-gray-700 hover:text-red-600 font-medium">
                      Réservation
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
                                <button onClick={clearCartHandler} className="flex-1 bg-gradient-to-br from-gray-500 to-gray-400 text-white py-2 rounded-2xl hover:bg-red-600 transition-colors text-sm">
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
                        <button onClick={()=>router.push("./commander")} className="text-left text-gray-700 hover:text-red-600 font-medium py-2 text-sm">Commander</button>
                        <button className="text-left text-gray-700 hover:text-red-600 font-medium py-2 text-sm">Profile</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </header>

      {/* Hero Section */}
      <section className="bg-red-50">
        <div className="max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-64">
            <div className='px-4 sm:px-8 py-6 sm:py-10 order-2 lg:order-1'>
              <div className="flex items-center mb-4">
                <span className="bg-white text-xs font-medium px-3 py-2 sm:py-3 rounded-full">+100 RESTAURANTS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-6xl text-[#eb061d] font-bold mb-4 leading-tight">
                Savourez, sans <br />
                bouger de chez <br />
                vous !
              </h1>
              <p className="text-gray-600 mb-6 max-w-md text-sm sm:text-base">
                Découvrez une expérience culinaire unique avec Bridge+. Des plats délicieux livrés rapidement et en toute sécurité directement chez vous.
              </p>
              <button onClick={()=>router.push("./commander")} className="bg-black text-white py-2 px-4 sm:px-6 rounded-3xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base">
                Commander maintenant
              </button>
            </div>
            
            {/* Image Section */}
            <div className="relative order-1 lg:order-2">
              <div className="relative overflow-hidden h-64 sm:h-80 lg:h-full lg:min-h-96">
                <div className="relative w-full h-full">
                  <Image 
                    src={imagePer} 
                    alt='Trois personnes partageant une pizza - Bridge+' 
                    width={1000} 
                    height={1000} 
                    className='z-10 w-full h-full object-cover relative'
                  />
                  
                  {/* Bouton WhatsApp */}
                  <div
                    onClick={() => window.open("https://wa.me/221775943114", "_blank")}
                    className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 
                               w-12 h-12 sm:w-14 sm:h-14 bg-green-500 
                               rounded-full flex items-center justify-center 
                               shadow-xl hover:bg-green-600 transition-all 
                               duration-300 cursor-pointer transform hover:scale-110
                               z-50 border-2 border-white"
                    style={{ zIndex: 1000 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="h-6 w-6 sm:h-7 sm:w-7"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Address Section */}
      <section className="bg-white max-w-4xl mx-4 sm:mx-auto py-4 sm:py-5 shadow-md mt-5 rounded-2xl sm:rounded-full">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium block mb-1">Saisissez votre adresse de livraison</label>
              <div className='flex items-center'>
                <MapPinIcon size={18} className='text-red-500 mr-2 flex-shrink-0'/>
                <input 
                  type="text" 
                  placeholder='Adresse, ville' 
                  className='text-sm border-b-2 border-gray-100 flex-1 min-w-0' 
                />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium block mb-1">Livraison</label>
              <div className='flex items-center'>
                <TimerIcon size={18} className='text-red-500 mr-2 flex-shrink-0'/>
                <select className='border-b-2 border-gray-100 text-sm flex-1 sm:flex-none'>
                  <option value="">Immediate</option>
                  <option value="">En attente</option>
                </select>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <button className="bg-[#eb061d] text-white px-6 sm:px-8 py-2 rounded-full hover:bg-red-500 transition-all duration-300 transform hover:scale-105 relative w-full sm:w-auto text-sm sm:text-base">
                <Search className="inline mr-2" size={16}/>
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-6 sm:py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Les meilleurs restaurants près de chez vous</h2>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white w-full h-32 sm:h-40 lg:h-44 rounded-xl shadow-lg hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="p-3 sm:p-6 text-center h-full flex flex-col justify-center">
                  <div className="flex-1 flex items-center justify-center mb-2">
                    <img src={restaurant.image} alt="image" className="max-w-full max-h-16 sm:max-h-20 object-contain" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">{restaurant.nom_restaurant}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-6 sm:py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Commandez votre repas</h2>
          
          {/* First 4 products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {produits.slice(0, 4).map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105">
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
                    <span className="truncate max-w-20 sm:max-w-none">{getRestaurantName(product.restaurant_id)}</span>
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
          
          {/* Second 4 products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {produits.slice(4, 8).map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105">
                <div className="relative">
                  <div className="h-40 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <img src={product.image} alt={product.nom_produit} className='w-full h-full object-cover'/>
                  </div>
                  {getRestaurantStatut(product.restaurant_id) === "ouvert" && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
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
                    <span className="truncate max-w-20 sm:max-w-none">{getRestaurantName(product.restaurant_id)}</span>
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
                    <span className="text-base sm:text-lg font-bold text-gray-900">FCFA {product.prix}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button onClick={()=>router.push("./commander")} className="border border-black px-8 sm:px-12 py-2 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base">
              Voir Tout
            </button>
          </div>
        </div>
      </section>

      {/* Promotion Section */}
      <section className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#eb061d] rounded-2xl p-4 sm:p-8 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center relative z-10">
              <div className="text-center lg:text-left">
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  Profitez d'une remise de<br/>
                  20% sur la livraison de votre<br/>
                  prochaine commande !
                </h2>
                <button onClick={()=>router.push("./commander")} className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 font-medium text-sm sm:text-base">
                  Commander maintenant
                </button>
              </div>
              
              <div className="relative h-48 sm:h-64 lg:h-64">
                {/* Pizza  */}
                <div className="hidden md:block">
                  <div className='bg-white w-16 sm:w-20 absolute top-4 sm:top-10 left-16 sm:left-20 rounded-full'>
                    <Image src={pizza} alt='pizza' width={130} height={130} />
                  </div>
                </div>
                
                {/* Sandwich */}
                <div>
                  <div className='bg-white w-20 sm:w-24 absolute bottom-0 sm:bottom-8 left-8 sm:left-12 rounded-full'>
                    <Image src={sandwich} alt='sandwich' width={150} height={150} />
                  </div>
                </div>
                
                {/* Poulet */}
                <div>
                  <div className='bg-white w-20 sm:w-24 absolute top-16 sm:top-32 right-4 sm:right-8 lg:right-11 rounded-full'>
                    <Image src={poulet} alt='poulet' width={150} height={150} />
                  </div>
                </div>
                
                {/* Livreur principal */}
                <div className="absolute top-4 sm:top-11 left-20 sm:left-28 h-full w-full flex justify-center lg:justify-end items-end">
                  <Image 
                    src={livreur} 
                    alt='livreur' 
                    className='object-contain object-bottom max-h-full'
                    width={600}
                    height={800}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-6 sm:py-8 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Nos clients témoignent</h2>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">{testimonial.name}</h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      <Modal show={showReductionModal} onClose={() => setShowReductionModal(false)}>
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="w-full lg:w-1/2 bg-gray-100 relative">
            <Image 
              src={Reduction}
              alt="Femme heureuse avec sac Bridget"
              className="w-full h-64 sm:h-80 lg:h-full object-cover rounded-l-2xl lg:rounded-r-none lg:rounded-l-2xl"
            />
          </div>

          {/* Formulaire */}
          <div className="w-full lg:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
            <div className="max-w-md mx-auto lg:mx-0 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 leading-tight">
                Profitez de 20% de réduction en rejoignant dès maintenant notre file d'attente !
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom et Nom
                  </label>
                  <input 
                    name="nom_complet"
                    type="text" 
                    value={formData.nom_complet}
                    onChange={handleInputChange}
                    placeholder="Miniane Diouf"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Loisbecket@gmail.com"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de téléphone
                  </label>
                  <input 
                    type="tel" 
                    name="numeroPhone"
                    value={formData.numeroPhone}
                    onChange={handleInputChange}
                    placeholder="+221 77 636 78 89"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="isCondition"
                      checked={formData.isCondition}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-red-500 border-2 border-gray-300 rounded focus:ring-red-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      J'accepte de recevoir des communications de Mafalia et de bénéficier de mon code promo.
                    </span>
                  </label>
                </div>

                <button 
                onClick={handleCreatePerson}
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Inscription en cours...' : 'Rejoindre la file d\'attente'}
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
        </div>
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
              <a onClick={()=>router.push("./commander")} className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium cursor-pointer">Commander</a>
              <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium cursor-pointer">Réservation</a>
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
      
      {/* Product Modal */}
      
    </div>
  );
};

export default BridgePlusApp;