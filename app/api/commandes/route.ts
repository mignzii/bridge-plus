import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

// GET - Récupérer la liste des commandes
export async function GET(request: NextRequest) {
  try {
    // Note: Pas d'authentification requise pour la récupération des commandes
    // const authCheck = checkAuth(request);
    // if (!authCheck.isValid) {
    //   return createCorsResponse(authCheck.error, 401);
    // }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const statut = url.searchParams.get('statut');
    const restaurantId = url.searchParams.get('restaurantId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    // Construire la requête
    let query = supabase
      .from('commandes_completes')
      .select('*')
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (statut) {
      query = query.eq('statut', statut);
    }
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
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

    const { data: commandes, error } = await query;

    if (error) {
      throw error;
    }

    // Compter le total pour la pagination
    let countQuery = supabase
      .from('commandes_completes')
      .select('*', { count: 'exact', head: true });

    if (statut) {
      countQuery = countQuery.eq('statut', statut);
    }
    if (restaurantId) {
      countQuery = countQuery.eq('restaurant_id', restaurantId);
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
        commandes,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    }, 500);
  }
}

// POST - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    // Pas d'authentification requise pour créer une commande client
    // const authCheck = checkAuth(request);
    // if (!authCheck.isValid) {
    //   return createCorsResponse(authCheck.error, 401);
    // }

    const body = await request.json();
    const {
      nom_client,
      email_client,
      telephone_client,
      adresse_livraison,
      instructions_livraison,
      date_retrait,
      heure_retrait,
      code_promo,
      notes_commande,
      items,
      restaurant_id
    } = body;

    // Validation des données requises
    if (!nom_client || !telephone_client || !adresse_livraison || !items || !restaurant_id) {
      return createCorsResponse({
        success: false,
        message: 'Données manquantes',
        error: 'nom_client, telephone_client, adresse_livraison, items et restaurant_id sont requis'
      }, 400);
    }

    // Calculer les totaux
    const total_items = items.reduce((sum: number, item: any) => sum + item.quantite, 0);
    const sous_total = items.reduce((sum: number, item: any) => sum + (item.prix_unitaire * item.quantite), 0);
    const rabais = sous_total * 0.2; // 20% de réduction par défaut
    const frais_livraison = 2000;
    const total = sous_total + frais_livraison - rabais;

    // Créer la commande
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .insert({
        nom_client,
        email_client,
        telephone_client,
        adresse_livraison,
        instructions_livraison,
        code_promo: code_promo || '',
        notes_commande,
        restaurant_id,
        sous_total,
        rabais,
        frais_livraison,
        date_retrait,
        heure_retrait,
        total,
        total_items
      })
      .select('id')
      .single();

    if (commandeError) {
      throw commandeError;
    }

    // Créer les items de la commande
    const commandeItems = items.map((item: any) => ({
      commande_id: commande.id,
      produit_id: item.produit_id,
      produit_nom: item.produit_nom,
      prix_unitaire: item.prix_unitaire,
      quantite: item.quantite,
      sous_total: item.prix_unitaire * item.quantite, // Calculer le sous-total
      image: item.image,
      categorie_id: item.categorie_id,
      accompagnants: JSON.stringify(item.accompagnants || [])
    }));

    const { error: itemsError } = await supabase
      .from('commande_items')
      .insert(commandeItems);

    if (itemsError) {
      throw itemsError;
    }

    // Enregistrer le changement de statut initial
    await supabase
      .from('commande_status_history')
      .insert({
        commande_id: commande.id,
        nouveau_statut: 'en_attente',
        raison: 'Commande créée',
        modifie_par: 'systeme',
        type_modificateur: 'systeme'
      });

    return createCorsResponse({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        commande_id: commande.id
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la création de la commande:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message
    }, 500);
  }
}
