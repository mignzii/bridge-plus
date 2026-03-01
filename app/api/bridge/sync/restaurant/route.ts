import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { addCorsHeaders, createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';
import { 
  RestaurantSyncRequest, 
  RestaurantSyncResponse, 
  BridgePlusErrorCode 
} from '@/types/bridge-mafalia-contract';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

export async function POST(request: NextRequest): Promise<NextResponse<RestaurantSyncResponse>> {
  const startTime = Date.now();
  
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const body: RestaurantSyncRequest = await request.json();
    const { restaurant, categories } = body;

    // Validation des données
    if (!restaurant || !restaurant.id || !restaurant.nom_restaurant) {
      return createCorsResponse({
        success: false,
        message: 'Données de restaurant invalides',
        error: {
          code: BridgePlusErrorCode.VALIDATION_ERROR,
          message: 'Restaurant ID et nom requis'
        }
      }, 400);
    }

    // Validation du statut
    if (restaurant.statut && !['ouvert', 'ferme'].includes(restaurant.statut)) {
      return createCorsResponse({
        success: false,
        message: 'Statut de restaurant invalide',
        error: {
          code: BridgePlusErrorCode.VALIDATION_ERROR,
          message: 'Statut doit être "ouvert" ou "ferme"'
        }
      }, 400);
    }

    // 1. Synchroniser le restaurant (restaurant.id = UUID Mafalia ou "uuid_centre_X" pour centres autonomes)
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('mafalia_restaurant_id', restaurant.id)
      .maybeSingle();

    let restaurantId: string;

    if (existingRestaurant) {
      // Mettre à jour le restaurant existant
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          nom_restaurant: restaurant.nom_restaurant,
          statut: restaurant.statut || 'ouvert',
          image: restaurant.image || null
        })
        .eq('id', existingRestaurant.id);

      if (updateError) throw updateError;
      restaurantId = existingRestaurant.id;
    } else {
      // Créer un nouveau restaurant
      const { data: newRestaurant, error: createError } = await supabase
        .from('restaurants')
        .insert([{
          nom_restaurant: restaurant.nom_restaurant,
          statut: restaurant.statut || 'ouvert',
          image: restaurant.image || null,
          mafalia_restaurant_id: restaurant.id
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      restaurantId = newRestaurant.id;
    }

    // 2. Synchroniser les catégories
    const categoriesMapping: Record<string, string> = {};

    for (const category of categories) {
      if (!category.id || !category.nom_categorie) {
        console.warn(`Catégorie invalide ignorée:`, category);
        continue;
      }

      // Vérifier si la catégorie existe déjà
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('mafalia_category_id', category.id)
        .single();

      if (existingCategory) {
        // Mettre à jour la catégorie existante
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            nom_categorie: category.nom_categorie
          })
          .eq('id', existingCategory.id);

        if (updateError) {
          console.error(`Erreur lors de la mise à jour de la catégorie ${category.id}:`, updateError);
          continue;
        }

        categoriesMapping[category.id] = existingCategory.id;
      } else {
        // Créer une nouvelle catégorie
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([{
            nom_categorie: category.nom_categorie,
            mafalia_category_id: category.id
          }])
          .select('id')
          .single();

        if (createError) {
          console.error(`Erreur lors de la création de la catégorie ${category.id}:`, createError);
          continue;
        }

        categoriesMapping[category.id] = newCategory.id;
      }
    }

    const processingTime = (Date.now() - startTime) / 1000;

    // Logger la synchronisation
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'bridge-plus-sync',
      restaurantId,
      action: 'sync_restaurant',
      categoriesCount: categories.length,
      processingTime,
      status: 'success'
    }));

    return createCorsResponse({
      success: true,
      message: 'Restaurant et catégories synchronisés',
      data: {
        restaurant_id: restaurantId,
        categories_mapping: categoriesMapping
      }
    });

  } catch (error: any) {
    const processingTime = (Date.now() - startTime) / 1000;
    
    console.error('Erreur lors de la synchronisation du restaurant:', error);
    
    // Logger l'erreur
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'bridge-plus-sync',
      action: 'sync_restaurant',
      processingTime,
      status: 'error',
      error: {
        code: BridgePlusErrorCode.DATABASE_ERROR,
        message: error.message
      }
    }));

    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la synchronisation du restaurant',
      error: {
        code: BridgePlusErrorCode.DATABASE_ERROR,
        message: error.message
      }
    }, 500);
  }
}