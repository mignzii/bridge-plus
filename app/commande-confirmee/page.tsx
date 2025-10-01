"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, MapPin, Phone, Mail, ArrowLeft } from 'lucide-react';
import { orderService } from '@/lib/services/orderService';

interface CommandeDetails {
  commande_id: string;
  numero_commande: string;
  nom_client: string;
  email_client?: string;
  telephone_client: string;
  adresse_livraison: string;
  instructions_livraison?: string;
  statut: string;
  sous_total: number;
  frais_livraison: number;
  rabais: number;
  total: number;
  created_at: string;
  commande_items: Array<{
    id: string;
    produit_nom: string;
    quantite: number;
    prix_unitaire: number;
    image: string;
    accompagnants?: string;
  }>;
}

const CommandeConfirmeeContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [commande, setCommande] = useState<CommandeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const commandeId = searchParams.get('commande');

  useEffect(() => {
    const fetchCommande = async () => {
      if (!commandeId) {
        setError('ID de commande manquant');
        setLoading(false);
        return;
      }

      try {
        const result = await orderService.getOrder(commandeId);
        if (result.success && result.data) {
          // L'API retourne { commande, items, statusHistory, transactions }
          const commandeData = {
            ...result.data.commande,
            commande_items: result.data.items
          };
          setCommande(commandeData);
        } else {
          setError(result.message || 'Erreur lors du chargement de la commande');
        }
      } catch (err: any) {
        setError('Erreur lors du chargement de la commande');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommande();
  }, [commandeId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmee':
        return 'text-blue-600 bg-blue-100';
      case 'en_preparation':
        return 'text-orange-600 bg-orange-100';
      case 'en_livraison':
        return 'text-purple-600 bg-purple-100';
      case 'livree':
        return 'text-green-600 bg-green-100';
      case 'annulee':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'En attente de confirmation';
      case 'confirmee':
        return 'Confirmée';
      case 'en_preparation':
        return 'En préparation';
      case 'en_livraison':
        return 'En cours de livraison';
      case 'livree':
        return 'Livrée';
      case 'annulee':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error || !commande) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h2>
          <p className="text-gray-600 mb-6">{error || 'Commande introuvable'}</p>
          <button
            onClick={() => router.push('/commander')}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retour à la commande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/commander')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
            <h1 className="text-xl font-semibold">Confirmation de commande</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message de succès */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Commande confirmée !
              </h2>
              <p className="text-gray-600">
                Votre commande a été enregistrée avec succès. Nous vous contacterons bientôt.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Détails de la commande */}
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Détails de la commande</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro de commande:</span>
                  <span className="font-medium">{commande.numero_commande}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(commande.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(commande.statut)}`}>
                    {getStatusText(commande.statut)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations client */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Informations de livraison</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{commande.nom_client}</p>
                    <p className="text-gray-600">{commande.adresse_livraison}</p>
                    {commande.instructions_livraison && (
                      <p className="text-sm text-gray-500 mt-1">
                        Instructions: {commande.instructions_livraison}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{commande.telephone_client}</span>
                </div>
                {commande.email_client && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{commande.email_client}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Articles et totaux */}
          <div className="space-y-6">
            {/* Articles commandés */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Articles commandés</h3>
              <div className="space-y-4">
                {commande.commande_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.produit_nom}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.produit_nom}</h4>
                      <p className="text-sm text-gray-600">Quantité: {item.quantite}</p>
                      {item.accompagnants && (
                        <p className="text-xs text-gray-500">
                          + {JSON.parse(item.accompagnants).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.prix_unitaire * item.quantite} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Récapitulatif des prix */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Récapitulatif</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total:</span>
                  <span className="font-medium">{commande.sous_total} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de livraison:</span>
                  <span className="font-medium">{commande.frais_livraison} FCFA</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Réduction:</span>
                  <span>-{commande.rabais} FCFA</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{commande.total} FCFA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Prochaines étapes</h3>
              <div className="space-y-2 text-blue-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Nous préparons votre commande</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Nous vous contacterons pour la livraison</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Livraison à l'adresse indiquée</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/commander')}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Commander à nouveau
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Imprimer la commande
          </button>
        </div>
      </div>
    </div>
  );
};

const CommandeConfirmeePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <CommandeConfirmeeContent />
    </Suspense>
  );
};

export default CommandeConfirmeePage;
