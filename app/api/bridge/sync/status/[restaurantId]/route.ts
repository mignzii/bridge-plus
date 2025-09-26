import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { addCorsHeaders, createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';
import { 
  SyncStatusResponse, 
  BridgePlusErrorCode 
} from '@/types/bridge-mafalia-contract';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
): Promise<NextResponse<SyncStatusResponse>> {
  const startTime = Date.now();
  
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const { restaurantId } = await params;

    // Vérifier que le restaurant existe
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, nom_restaurant, created_at')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return createCorsResponse({
        success: false,
        message: 'Restaurant introuvable',
        error: {
          code: BridgePlusErrorCode.RESTAURANT_NOT_FOUND,
          message: `Restaurant avec ID ${restaurantId} introuvable`
        }
      }, 404);
    }

    // Compter le nombre total de produits
    const { count: totalProducts, error: productsError } = await supabase
      .from('produits')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);

    if (productsError) {
      console.error('Erreur lors du comptage des produits:', productsError);
    }

    // Compter le nombre de catégories
    const { count: totalCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (categoriesError) {
      console.error('Erreur lors du comptage des catégories:', categoriesError);
    }

    // Récupérer la dernière synchronisation (basée sur la date de création du restaurant)
    const lastSyncTime = restaurant.created_at;

    // Calculer le statut de synchronisation
    // Pour simplifier, on considère qu'une synchronisation est complète si :
    // - Le restaurant existe
    // - Il y a des produits associés
    const isComplete = (totalProducts || 0) > 0;

    // Estimer le nombre de batches (basé sur la configuration des lots)
    const estimatedBatches = totalProducts ? Math.ceil(totalProducts / 25) : 0; // 25 produits par lot par défaut

    const processingTime = (Date.now() - startTime) / 1000;

    // Logger la requête de statut
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'bridge-plus-sync',
      restaurantId,
      action: 'get_sync_status',
      totalProducts: totalProducts || 0,
      totalCategories: totalCategories || 0,
      processingTime,
      status: 'success'
    }));

    return createCorsResponse({
      success: true,
      data: {
        restaurantId,
        isComplete,
        processedBatches: estimatedBatches,
        totalBatches: estimatedBatches,
        lastBatchTime: lastSyncTime,
        totalProducts: totalProducts || 0
      }
    });

  } catch (error: any) {
    const processingTime = (Date.now() - startTime) / 1000;
    
    console.error('Erreur lors de la récupération du statut:', error);
    
    // Logger l'erreur
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'bridge-plus-sync',
      action: 'get_sync_status',
      processingTime,
      status: 'error',
      error: {
        code: BridgePlusErrorCode.DATABASE_ERROR,
        message: error.message
      }
    }));

    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: {
        code: BridgePlusErrorCode.DATABASE_ERROR,
        message: error.message
      }
    }, 500);
  }
}