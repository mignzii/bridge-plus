import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

// POST - Créer une transaction de paiement
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const body = await request.json();
    const {
      commande_id,
      montant,
      methode_paiement,
      operateur,
      reference_paiement,
      metadata
    } = body;

    // Validation des données requises
    if (!commande_id || !montant || !methode_paiement) {
      return createCorsResponse({
        success: false,
        message: 'Données manquantes',
        error: 'commande_id, montant et methode_paiement sont requis'
      }, 400);
    }

    // Vérifier que la commande existe
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .select('total')
      .eq('id', commande_id)
      .single();

    if (commandeError) {
      if (commandeError.code === 'PGRST116') {
        return createCorsResponse({
          success: false,
          message: 'Commande non trouvée',
          error: 'Commande introuvable'
        }, 404);
      }
      throw commandeError;
    }

    // Vérifier que le montant correspond
    if (Number(montant) !== Number(commande.total)) {
      return createCorsResponse({
        success: false,
        message: 'Montant incorrect',
        error: `Le montant de la transaction (${montant}) ne correspond pas au total de la commande (${commande.total})`
      }, 400);
    }

    // Calculer les frais de transaction
    let frais_transaction = 0;
    switch (methode_paiement) {
      case 'mobile_money':
        frais_transaction = montant * 0.02; // 2%
        break;
      case 'carte_bancaire':
        frais_transaction = montant * 0.035; // 3.5%
        break;
      case 'especes':
        frais_transaction = 0;
        break;
      case 'virement':
        frais_transaction = 500; // Frais fixes
        break;
      default:
        frais_transaction = 0;
    }

    const montant_net = montant - frais_transaction;

    // Générer un numéro de transaction unique
    const numero_transaction = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Créer la transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        commande_id,
        numero_transaction,
        type_transaction: 'paiement',
        statut: 'en_attente',
        montant,
        devise: 'FCFA',
        frais_transaction,
        montant_net,
        methode_paiement,
        operateur,
        reference_paiement,
        metadata: metadata ? JSON.stringify(metadata) : null
      })
      .select('id, numero_transaction')
      .single();

    if (transactionError) {
      throw transactionError;
    }

    return createCorsResponse({
      success: true,
      message: 'Transaction créée avec succès',
      data: {
        transaction_id: transaction.id,
        numero_transaction: transaction.numero_transaction
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la création de la transaction:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la création de la transaction',
      error: error.message
    }, 500);
  }
}

// GET - Récupérer les transactions
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const statut = url.searchParams.get('statut');
    const type_transaction = url.searchParams.get('type_transaction');
    const methode_paiement = url.searchParams.get('methode_paiement');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Construire la requête
    let query = supabase
      .from('transactions')
      .select(`
        *,
        commandes (
          id,
          numero_commande,
          nom_client,
          total
        )
      `)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (statut) {
      query = query.eq('statut', statut);
    }
    if (type_transaction) {
      query = query.eq('type_transaction', type_transaction);
    }
    if (methode_paiement) {
      query = query.eq('methode_paiement', methode_paiement);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error } = await query;

    if (error) {
      throw error;
    }

    // Compter le total pour la pagination
    let countQuery = supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (statut) {
      countQuery = countQuery.eq('statut', statut);
    }
    if (type_transaction) {
      countQuery = countQuery.eq('type_transaction', type_transaction);
    }
    if (methode_paiement) {
      countQuery = countQuery.eq('methode_paiement', methode_paiement);
    }
    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo);
    }

    const { count } = await countQuery;

    return createCorsResponse({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des transactions:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération des transactions',
      error: error.message
    }, 500);
  }
}
