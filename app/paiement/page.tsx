"use client"
import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, User, Star, MapPin, Clock, ChevronLeft, ChevronRight, Phone, MapPinIcon, TimerIcon, Minus, Plus, Trash2, Tag, CreditCard, ArrowRight, UserCircle2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { orderService, CreateTransactionRequest } from '@/lib/services/orderService';
import Image from 'next/image';
import orange from '@/assets/orange.png';
import wave from '@/assets/wave.jpg';
import yas from '@/assets/yas.png';

const BridgePlusApp = () => {
  const router = useRouter();
  const { items, summary, clearCart } = useCart();
    const [message, setMessage] = useState<{ type: string; text: string }>({ type: "", text: "" });
    const [selectedPayment, setSelectedPayment] = useState('wave');
    const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    nom_client: '',
    telephone_client: '',
    adresse_livraison: '',
    instructions_livraison: '',
    code_promo: '',
    notes_commande: '',
    date_retrait: '',
    heure_retrait: '',
  });

  const [modeRecuperation, setModeRecuperation] = useState<'livraison' | 'retrait'>('livraison');
  const fraisLivraison = modeRecuperation === 'livraison' ? 2000 : 0;
  const totalAvecLivraison = summary.total + fraisLivraison;

    const SenegalFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 60 40">
    <rect width="20" height="40" x="0" y="0" fill="#00853F"/>   {/* Vert */}
    <rect width="20" height="40" x="20" y="0" fill="#FDEF42"/>  {/* Jaune */}
    <rect width="20" height="40" x="40" y="0" fill="#E31B23"/>  {/* Rouge */}
    <polygon points="30,12 32.6,20 41,20 34,25 36.5,33 30,28 23.5,33 26,25 19,20 27.4,20" fill="#00853F"/>
  </svg>
);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/commander');
    }
  }, [items.length, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nom_client.trim()) {
      setMessage({ type: "error", text: "Le nom et prénom sont requis" });
      return false;
    }
    if (!formData.telephone_client.trim()) {
      setMessage({ type: "error", text: "Le numéro de téléphone est requis" });
      return false;
    }
    if (modeRecuperation === 'livraison' && !formData.adresse_livraison.trim()) {
      setMessage({ type: "error", text: "L'adresse de livraison est requise pour la livraison" });
      return false;
    }
    // Validation du numéro de téléphone sénégalais (optionnel)
    const phoneRegex = /^[67]\d{8}$/;
    if (formData.telephone_client && !phoneRegex.test(formData.telephone_client.replace(/\s/g, ''))) {
      setMessage({ type: "error", text: "Format de téléphone invalide (ex: 762430964)" });
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Créer la commande avec le premier restaurant des items
      const firstItem = items[0];
      const heureWithSeconds = formData.heure_retrait ? `${formData.heure_retrait}:00` : undefined;
      const orderData = {
        nom_client: formData.nom_client,
        telephone_client: formData.telephone_client,
        adresse_livraison: formData.adresse_livraison,
        instructions_livraison: formData.instructions_livraison || undefined,
        date_retrait: formData.date_retrait || undefined,
        heure_retrait: heureWithSeconds,
        code_promo: formData.code_promo || undefined,
        notes_commande: formData.notes_commande || undefined,
        restaurant_id: firstItem.restaurant_id,
        items: items.map(item => ({
          produit_id: item.produit_id,
          produit_nom: item.produit_nom,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          image: item.image,
          accompagnants: JSON.stringify(item.accompagnants || [])
        }))
      };

      // Appel direct à l'API
      const response = await fetch('/api/commandes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const orderResult = await response.json();
      
      if (!orderResult.success) {
        setMessage({ type: "error", text: orderResult.message || "Erreur lors de la création de la commande" });
        return;
      }

      // 2. Créer la transaction
      const transactionData: CreateTransactionRequest = {
        commande_id: orderResult.data.commande_id,
        montant: totalAvecLivraison,
        methode_paiement: selectedPayment === 'wave' ? 'mobile_money' : 
                          selectedPayment === 'orange' ? 'mobile_money' : 
                          selectedPayment === 'yas' ? 'mobile_money' : 'mobile_money',
        operateur: selectedPayment === 'wave' ? 'Wave' : 
                  selectedPayment === 'orange' ? 'Orange Money' : 
                  selectedPayment === 'yas' ? 'Yas Money' : 'Wave',
        ip_client: '127.0.0.1',
        user_agent: navigator.userAgent,
        metadata: {
          payment_method: selectedPayment,
          timestamp: new Date().toISOString()
        }
      };

      const transactionResult = await orderService.createTransaction(transactionData);
      
      if (!transactionResult.success) {
        setMessage({ type: "error", text: transactionResult.message || "Erreur lors de la création de la transaction" });
        return;
      }

      // 3. Simuler le processus de paiement
      setMessage({ type: "success", text: "Commande créée avec succès ! Traitement du paiement en cours..." });
      
      // Simuler une confirmation de paiement après 3 secondes
      setTimeout(async () => {
        const confirmResult = await orderService.updateTransactionStatus(
          transactionResult.data?.transaction_id || '',
          'reussie',
          `PAY_${Date.now()}`,
          { confirmed_at: new Date().toISOString() }
        );

        if (confirmResult.success) {
          setMessage({ type: "success", text: "Paiement confirmé ! Votre commande est en cours de préparation." });
          
          // Vider le panier
          clearCart();
          
          // Rediriger vers une page de confirmation après 2 secondes
          setTimeout(() => {
            router.push(`/commande-confirmee?commande=${orderResult.data.commande_id}`);
          }, 2000);
        } else {
          setMessage({ type: "error", text: "Erreur lors de la confirmation du paiement" });
        }
      }, 3000);

    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      setMessage({ 
        type: "error", 
        text: "Une erreur est survenue lors du traitement de votre commande" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Panier vide</h2>
          <p className="text-gray-600 mb-6">Votre panier est vide. Ajoutez des produits pour continuer.</p>
          <button
            onClick={() => router.push('/commander')}
            className="bg-[#16a34a] text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
            {/* Navigation */}
                        <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => router.push('/commander')}
                className="text-gray-700 hover:text-green-600 font-medium"
              >
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
                              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
            
           <div className="flex items-center space-x-4">
              {/* Container relatif pour le panier avec badge */}
              <div className="relative">
                <div 
                  onClick={() => router.push('/panier')}
                  className="text-gray-600 hover:text-green-600 cursor-pointer"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {/* Badge du compteur repositionné */}
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {items.length}
                    </span>
                  )}
                </div>
              </div>

              <button className="text-gray-600 hover:text-green-600">
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
                <ChevronRight className="w-4 h-4 mx-2" />
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
                    name="nom_client"
                    value={formData.nom_client}
                    onChange={handleInputChange}
                placeholder="Entrez votre nom et prénom"
                    className="w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone *
              </label>
              <div className="flex">
                <div className="flex items-center bg-gray-100 border border-gray-300 rounded-l-full px-3 py-3">
                      <div className="w-6 h-4 mr-2 mx-2"><SenegalFlag/></div>
                  <span className="text-gray-600 text-sm mx-2">+221</span>
                </div>
                <input
                  type="tel"
                      name="telephone_client"
                      value={formData.telephone_client}
                      onChange={handleInputChange}
                      placeholder="77 123 45 67"
                  className="flex-1 bg-gray-100 border border-gray-300 border-l-0 rounded-r-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

                {/* Mode de récupération */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de récupération *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      modeRecuperation === 'livraison' 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="mode_recuperation"
                        value="livraison"
                        checked={modeRecuperation === 'livraison'}
                        onChange={(e) => setModeRecuperation(e.target.value as 'livraison' | 'retrait')}
                        className="sr-only"
                      />
                      <div className="text-center w-full">
                        <div className="text-2xl mb-1">🚚</div>
                        <div className="font-medium">Livraison</div>
                        <div className="text-xs text-gray-600">2000 FCFA</div>
                      </div>
                    </label>

                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      modeRecuperation === 'retrait' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}>
                      <input
                        type="radio"
                        name="mode_recuperation"
                        value="retrait"
                        checked={modeRecuperation === 'retrait'}
                        onChange={(e) => setModeRecuperation(e.target.value as 'livraison' | 'retrait')}
                        className="sr-only"
                      />
                      <div className="text-center w-full">
                        <div className="text-2xl mb-1">🏪</div>
                        <div className="font-medium">Retrait</div>
                        <div className="text-xs text-gray-600">Gratuit</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Adresse de livraison - Conditionnelle */}
                {modeRecuperation === 'livraison' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instruction de livraison *
                    </label>
                    <textarea
                      name="adresse_livraison"
                      value={formData.instructions_livraison}
                      onChange={handleInputChange}
                      placeholder="Ex : Quartier, appartement 3B, entrer par la porte côté rue, sonner à la porte principale, étage 2, près de l’ascenseur"
                      rows={3}
                      className="w-full text-sm bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}

                {/* Adresse de retrait - Informatif */}
               {modeRecuperation === 'retrait' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <h4 className="font-medium text-green-800 mb-2 text-xs sm:text-sm lg:text-base">🏪 Point de retrait</h4>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date de retrait</label>
                    <input
                    value={formData.date_retrait}
                      type="date"
                      name='date_retrait'
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Heure de retrait</label>
                    <input
                    value={formData.heure_retrait}
                    onChange={handleInputChange}
                    name='heure_retrait'
                      type="time"
                      className="w-full bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>
              )}


                <div className='border-b border-gray-200 mb-2'></div>

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

                {/* Message */}
                {message.text && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

            {/* Payer Button */}
                <button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-[#16a34a] text-white py-4 rounded-full font-medium flex items-center justify-center hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      <span>Traitement en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Payer {totalAvecLivraison} FCFA</span>
              <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Somme Commande
            </h2>

                <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span>Sous-total</span>
                    <span className="font-medium">FCFA {summary.sous_total}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Rabais (-20%)</span>
                    <span className="font-medium text-green-600">-{summary.rabais} FCFA</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                {modeRecuperation === 'livraison' ? '🚚' : '🏪'}
                {modeRecuperation === 'livraison' ? 'Livraison' : 'Retrait gratuit'}
              </span>
              <span className="font-medium">
                {fraisLivraison > 0 ? `FCFA ${fraisLivraison}` : 'Gratuit'}
              </span>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                      <span>FCFA {totalAvecLivraison}</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
      </section>

  {/* Footer */}
          <footer className="bg-green-50 py-6 sm:py-8 lg:py-16">
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
          
          {/* Navigation Links and Social Media Icons */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-4 sm:mb-8 space-y-6 lg:space-y-0 mx-4 sm:mx-10">
            {/* Navigation Links */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-7 text-center sm:text-left">
              <a href="#" className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium">À propos</a>
              <a onClick={()=>router.push("./commander")} className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium cursor-pointer">Commander</a>
              <a href="#" className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium">Réservation</a>
               <a href="https://www.mafalia.com/" className="text-gray-800 hover:text-[#16a34a] transition-colors font-medium cursor-pointer">Mafalia</a>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex gap-4 space-x-2">
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#16a34a] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#16a34a] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
              </div>
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#16a34a] transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
              <div className='rounded-full border border-gray-200 p-2'>
                <a href="#" className="text-gray-600 hover:text-[#16a34a] transition-colors">
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
            <p className="text-gray-600 text-xs sm:text-sm mt-3">© Copyright Ajamaat Mobilité, 2025</p>
          </div>
        </div>
      </footer>
  </div>
  );
};

export default BridgePlusApp;