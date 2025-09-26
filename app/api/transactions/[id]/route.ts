import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

// GET - Récupérer les détails d'une transaction
export async function GET(
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

    // Récupérer la transaction avec les détails de la commande
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        commandes (
          id,
          numero_commande,
          nom_client,
          email_client,
          telephone_client,
          adresse_livraison,
          total,
          statut
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return createCorsResponse({
          success: false,
          message: 'Transaction non trouvée',
          error: 'Transaction introuvable'
        }, 404);
      }
      throw error;
    }

    return createCorsResponse({
      success: true,
      data: transaction
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération de la transaction:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération de la transaction',
      error: error.message
    }, 500);
  }
}

// PUT - Mettre à jour le statut d'une transaction
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
    const { statut, reference_paiement, metadata } = body;

    if (!statut) {
      return createCorsResponse({
        success: false,
        message: 'Statut requis',
        error: 'Le nouveau statut est requis'
      }, 400);
    }

    // Récupérer la transaction actuelle
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('statut, commande_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createCorsResponse({
          success: false,
          message: 'Transaction non trouvée',
          error: 'Transaction introuvable'
        }, 404);
      }
      throw fetchError;
    }

    // Mettre à jour la transaction
    const updateData: any = {
      statut,
      updated_at: new Date().toISOString()
    };

    if (reference_paiement) {
      updateData.reference_paiement = reference_paiement;
    }
    if (metadata) {
      updateData.metadata = JSON.stringify(metadata);
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Si le paiement est réussi, mettre à jour le statut de la commande
    if (statut === 'reussie') {
      const { error: commandeUpdateError } = await supabase
        .from('commandes')
        .update({ 
          statut: 'confirmee',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentTransaction.commande_id);

      if (commandeUpdateError) {
        console.error('Erreur lors de la mise à jour de la commande:', commandeUpdateError);
      } else {
        // Enregistrer le changement de statut de la commande
        await supabase
          .from('commande_status_history')
          .insert({
            commande_id: currentTransaction.commande_id,
            ancien_statut: 'en_attente',
            nouveau_statut: 'confirmee',
            raison: 'Paiement réussi',
            modifie_par: 'systeme',
            type_modificateur: 'systeme'
          });
      }
    }

    return createCorsResponse({
      success: true,
      message: 'Statut de la transaction mis à jour avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la transaction:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la mise à jour de la transaction',
      error: error.message
    }, 500);
  }
}
