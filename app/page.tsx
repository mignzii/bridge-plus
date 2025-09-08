"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import imagePer from '@/assets/imagePer.png'
import livreur from '@/assets/livreur.png'
import pizza from '@/assets/pizza.png';
import poulet from '@/assets/poulet.png';
import sandwich from '@/assets/sandwich.png';
import { Search, ShoppingCart, User, Star, MapPin, Clock, ChevronLeft, ChevronRight, Phone, MapPinIcon, TimerIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getRestaurants } from './api/restaurants';
import { getProduits } from './api/produits';
type Restaurant = {
  id:string;
  nom_restaurant: string;
  image: string;
  statut: string;
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

const BridgePlusApp = () => {
  const [selectedDelivery, setSelectedDelivery] = useState('immediate');
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center ml-6">
              <h1 className="text-2xl italic font-extrabold text-[#eb061d]">Bridge+</h1>
            </div>
            <nav className="hidden md:flex">
              <h2 onClick={()=>router.push('./commander')} className="hover:text-red-600 px-3 py-2 text-sm font-semibold transition-colors cursor-pointer">Commander</h2>
              <a href="#" className="hover:text-red-600 px-3 py-2 text-sm font-semibold transition-colors">Réservation</a>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block w-[400px]">
                <input 
                  type="text" 
                  placeholder="Rechercher un produit..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-200 border-gray-300 rounded-3xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <ShoppingCart className="h-6 w-6 text-gray-700 cursor-pointer hover:text-red-600 transition-colors" />
              <User className="h-6 w-6 text-gray-700 cursor-pointer hover:text-red-600 transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-red-50">
        <div className="max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-64">
            <div className='px-8 py-10'>
              <div className="flex items-center mb-4">
                <span className="bg-white text-xs font-medium px-3 py-3 rounded-full">+100 RESTAURANTS</span>
              </div>
              <h1 className="text-4xl lg:text-6xl text-[#eb061d] font-bold mb-4">
                Savourez, sans <br />
                bouger de chez <br />
                vous !
              </h1>
              <p className="text-gray-600 mb-6 max-w-md">
                Découvrez une expérience culinaire unique avec Bridge+. Des plats délicieux livrés rapidement et en toute sécurité directement chez vous.
              </p>
              <button className="bg-black text-white py-2 px-2 rounded-3xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105">
                Commander maintenant
              </button>
            </div>
            
            {/* Section*/}
            <div className="relative">
              <div className="relative overflow-hidden h-full min-h-96">
                <div className="relative w-full h-full">
                  <Image 
                    src={imagePer} 
                    alt='Trois personnes partageant une pizza - Bridge+' 
                    width={1000} 
                    height={1000} 
                    className='z-10 w-full h-full object-cover relative'
                  />
                </div>
                <div className="absolute bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all duration-300 cursor-pointer transform hover:scale-110">
                  <svg 
                    className="h-8 w-8 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Address Section */}
      <section className="bg-white max-w-4xl py-5 shadow-md mt-5 rounded-full mx-auto">
        <div className=" mx-auto sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <label className="text-sm font-medium">Saisissez votre adresse de livraison</label>
              <div className='flex mt-2'>
                <MapPinIcon size={18} className='text-red-500'/>
                <input type="text" placeholder='Adresse, ville' className='text-sm border-b-2 border-gray-100' />
              </div>
            </div>
            <div className=''>
              <label className="text-sm font-medium">Livraison</label>
              <div className='flex mt-2'>
                <TimerIcon size={18} className='text-red-500'/>
                <select className='border-b-2 border-gray-100'>
                  <option value="">Immediate</option>
                  <option value="">En attente</option>
                </select>
              </div>
            </div>
            <div>
               <button className="bg-[#eb061d] text-white px-8 py-2 rounded-full hover:bg-red-500 transition-all duration-300 transform hover:scale-105">
                <Search className="absolute left-2 mt-1" size={16}/>
              Rechercher
            </button>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Les meilleurs restaurants près de chez vous</h2>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white w-44 h-44 rounded-xl shadow-lg hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
                <div className="p-6 text-center">
                  <img src={restaurant.image} alt="image" />
                  <h3 className="font-bold text-gray-900 mb-5">{restaurant.nom_restaurant}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* productes Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Commandez votre repas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {produits.slice(0, 4).map((product) => (
              <div key={product.id} className="bg-white rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105">
                <div className="relative">
                  <div className="h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <img src={product.image} alt={product.nom_produit} className='w-full h-full object-cover'/>
                  </div>
                  {getRestaurantStatut(product.restaurant_id) === "ouvert" && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Ouvert
                      </div>
                    )}
                    {getRestaurantStatut(product.restaurant_id) === "ferme" && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Fermé
                      </div>
                    )}
                      <div className="absolute bottom-3 left-3 bg-opacity-70 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-2">
                        <img 
                          src={getRestaurantImage(product.restaurant_id)} 
                          alt="image" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span>{getRestaurantName(product.restaurant_id)}</span>
                      </div>

                </div>
                <div className="p-4">
                 
                  <div className="flex items-center">
                    <h3 className="font-extrabold text-md mr-2 text-gray-900">{product.nom_produit}</h3>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-md font-extrabold">{product.note}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-extrabold text-gray-900">FCFA {product.prix}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {produits.slice(4, 8).map((product) => (
              <div key={product.id} className="bg-white rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-105">
                <div className="relative">
                  <div className="h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <img src={product.image} alt={product.nom_produit} className='w-full h-full object-cover'/>
                  </div>
                  {getRestaurantStatut(product.restaurant_id) === "ouvert" && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Ouvert
                      </div>
                    )}
                    {getRestaurantStatut(product.restaurant_id) === "ferme" && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Fermé
                      </div>
                    )}
                  <div className="absolute bottom-3 left-3 bg-opacity-70 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-2">
                        <img 
                          src={getRestaurantImage(product.restaurant_id)} 
                          alt="image" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span>{getRestaurantName(product.restaurant_id)}</span>
                      </div>
                </div>
                <div className="p-4">
                   <div className="flex items-center">
                    <h3 className="font-extrabold text-md mr-2 text-gray-900">{product.nom_produit}</h3>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-md font-extrabold">{product.note}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 mb-2">FCFA {product.prix}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button className="border border-black px-12 py-1 rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105">
              Voir Tout
            </button>
          </div>
        </div>
      </section>

      {/* Promotion Section */}
      <section className="py-2">
  <div className="mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-[#eb061d] rounded-2xl p-8 relative overflow-hidden">
    
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        <div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
            Profitez d'une remise de<br/>
            20% sur la livraison de votre<br/>
            prochaine commande !
          </h2>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 font-medium">
            Commander maintenant
          </button>
        </div>
        
        <div className="relative h-64 lg:h-64">
          <div className=''>
            <div className='bg-white w-20 absolute mt-10 ml-20 rounded-full'>
              <Image src={pizza} alt='pizza' width={130} height={130} />
            </div>
          </div>
           <div>
            <div className='bg-white w-24 absolute mt-48 ml-12 rounded-full'>
              <Image src={sandwich} alt='poulet' width={150} height={150} />
            </div>
          </div>
          <div>
            <div className='bg-white w-24 absolute mt-32 mr-11 rounded-full'>
              <Image src={poulet} alt='poulet' width={150} height={150} />
            </div>
          </div>
         
         
         
          {/* Livreur principal - remplit tout l'espace */}
          <div className="absolute mt-11 ml-28 h-full w-full inset-0 flex justify-end items-end">
            <Image 
              src={livreur} 
              alt='livreur' 
              className='object-contain object-bottom'
              width={800}
              height={1000}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Nos clients témoignent</h2>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{testimonial.name}</h3>
                <p className="text-gray-600 text-sm">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

  {/* Footer */}
<footer className="bg-red-50 py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-8xl italic font-extrabold text-[#eb061d] mb-4">Bridge+</h2>
      <p className="text-xl font-semibold text-gray-800">Commande Rapide et Sécurisée</p>
    </div>
    
    {/* Navigation Links and Social Media Icons on same line */}
    <div className="flex justify-between items-center mb-8 mx-10">
      {/* Navigation Links */}
      <div className="flex gap-7">
        <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">À propos</a>
        <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Commander</a>
        <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Réservation</a>
        <a href="#" className="text-gray-800 hover:text-[#eb061d] transition-colors font-medium">Mafalia</a>
      </div>
      
      {/* Social Media Icons */}
      <div className="flex gap-4 space-x-2">
        <div className='rounded-full border border-gray-200'>
          <a href="#" className="text-gray-600  hover:text-[#eb061d] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
        <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
          </svg>
        </a>
        <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
          </svg>
        </a>
        <a href="#" className="text-gray-600 hover:text-[#eb061d] transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
      </div>
    </div>
    
    <div className='border-b border-gray-200'></div>

    {/* Copyright */}
    <div className="text-center">
      <p className="text-gray-600 text-sm mt-3">© Copyright BridgePlus, 2025</p>
    </div>
    </div>
    </footer>
  </div>
  );
};

export default BridgePlusApp;