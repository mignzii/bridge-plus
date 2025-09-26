import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

// GET - Récupérer les détails d'une commande
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Pas d'authentification requise pour consulter une commande
    const { id } = await params;

    // Récupérer la commande avec tous les détails
    const { data: commande, error: commandeError } = await supabase
      .from('commandes_completes')
      .select('*')
      .eq('id', id)
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

    // Récupérer les items de la commande
    const { data: items, error: itemsError } = await supabase
      .from('commande_items')
      .select(`
        *,
        produits (
          id,
          nom_produit,
          image,
          description,
          prix,
          note
        )
      `)
      .eq('commande_id', id);

    if (itemsError) {
      throw itemsError;
    }

    // Récupérer l'historique des statuts
    const { data: statusHistory, error: historyError } = await supabase
      .from('commande_status_history')
      .select('*')
      .eq('commande_id', id)
      .order('created_at', { ascending: true });

    if (historyError) {
      throw historyError;
    }

    // Récupérer les transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('commande_id', id)
      .order('created_at', { ascending: true });

    if (transactionsError) {
      throw transactionsError;
    }

    return createCorsResponse({
      success: true,
      data: {
        commande,
        items: items.map(item => ({
          ...item,
          accompagnants: item.accompagnants ? JSON.parse(item.accompagnants) : []
        })),
        statusHistory,
        transactions
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message
    }, 500);
  }
}

// PUT - Mettre à jour le statut d'une commande
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { statut, raison, modifie_par, type_modificateur } = body;

    if (!statut) {
      return createCorsResponse({
        success: false,
        message: 'Statut requis',
        error: 'Le nouveau statut est requis'
      }, 400);
    }

    // Récupérer l'ancien statut
    const { data: currentCommande, error: fetchError } = await supabase
      .from('commandes')
      .select('statut')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createCorsResponse({
          success: false,
          message: 'Commande non trouvée',
          error: 'Commande introuvable'
        }, 404);
      }
      throw fetchError;
    }

    // Mettre à jour le statut
    const { error: updateError } = await supabase
      .from('commandes')
      .update({ 
        statut,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Enregistrer le changement dans l'historique
    const { error: historyError } = await supabase
      .from('commande_status_history')
      .insert({
        commande_id: id,
        ancien_statut: currentCommande.statut,
        nouveau_statut: statut,
        raison: raison || 'Statut mis à jour',
        modifie_par: modifie_par || 'systeme',
        type_modificateur: type_modificateur || 'systeme'
      });

    if (historyError) {
      throw historyError;
    }

    return createCorsResponse({
      success: true,
      message: 'Statut de la commande mis à jour avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la mise à jour de la commande',
      error: error.message
    }, 500);
  }
}
