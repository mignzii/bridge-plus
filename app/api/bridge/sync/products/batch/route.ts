import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { addCorsHeaders, createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';
import { 
  ProductsBatchRequest, 
  ProductsBatchResponse, 
  BridgePlusErrorCode,
  validateBatch 
} from '@/types/bridge-mafalia-contract';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

export async function POST(request: NextRequest): Promise<NextResponse<ProductsBatchResponse>> {
  const startTime = Date.now();
  
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const body: ProductsBatchRequest = await request.json();
    const { products, batchId, totalBatches, currentBatch, restaurantId } = body;

    // Validation des données
    const validation = validateBatch(body);
    if (!validation.isValid) {
      return createCorsResponse({
        success: false,
        message: 'Données de lot invalides',
        error: {
          code: BridgePlusErrorCode.VALIDATION_ERROR,
          message: 'Validation échouée',
          details: validation.errors
        }
      }, 400);
    }

    // Vérifier que le restaurant existe et récupérer l'ID Bridge+
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('mafalia_restaurant_id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return createCorsResponse({
        success: false,
        message: 'Restaurant introuvable',
        error: {
          code: BridgePlusErrorCode.RESTAURANT_NOT_FOUND,
          message: `Restaurant avec ID Mafalia ${restaurantId} introuvable`
        }
      }, 404);
    }

    const bridgeRestaurantId = restaurant.id;

    // Traitement des produits
    const produitsMapping: Record<string, string> = {};
    let processedCount = 0;

    for (const product of products) {
      try {
        // Vérifier que la catégorie existe (par mafalia_category_id)
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('mafalia_category_id', product.categorie_id)
          .single();

        if (categoryError || !category) {
          console.warn(`Catégorie ${product.categorie_id} introuvable pour le produit ${product.id}. Création d'une catégorie temporaire.`);
          
          // Créer une catégorie temporaire si elle n'existe pas
          const { data: newCategory, error: createCategoryError } = await supabase
            .from('categories')
            .insert({
              nom_categorie: `Catégorie ${product.categorie_id}`,
              mafalia_category_id: product.categorie_id
            })
            .select('id')
            .single();

          if (createCategoryError) {
            console.error(`Erreur lors de la création de la catégorie ${product.categorie_id}:`, createCategoryError);
            continue;
          }
          
          product.categorie_id = newCategory.id;
        } else {
          product.categorie_id = category.id;
        }

        // Vérifier si le produit existe déjà (par mafalia_product_id ET restaurant_id)
        // Important: le même produit Mafalia peut exister dans le siège ET dans un centre autonome → lignes distinctes
        const { data: existingProduct, error: existingError } = await supabase
          .from('produits')
          .select('id')
          .eq('mafalia_product_id', product.id)
          .eq('restaurant_id', bridgeRestaurantId)
          .maybeSingle();

        if (existingProduct && !existingError) {
          // Mettre à jour le produit existant
          const { error: updateError } = await supabase
            .from('produits')
            .update({
              nom_produit: product.nom_produit,
              prix: product.prix,
              description: product.description || null,
              image: product.image || null,
              note: product.note || null,
              restaurant_id: bridgeRestaurantId, // Utiliser l'ID Bridge+ du restaurant
              categorie_id: product.categorie_id,
              accompagnants: product.accompagnants ? JSON.stringify(product.accompagnants) : '[]'
            })
            .eq('id', existingProduct.id);

          if (updateError) {
            console.error(`Erreur lors de la mise à jour du produit ${product.id}:`, updateError);
            continue;
          }

          produitsMapping[product.id] = existingProduct.id;
        } else {
          // Créer un nouveau produit
          const { data: newProduct, error: createError } = await supabase
            .from('produits')
            .insert([{
              nom_produit: product.nom_produit,
              prix: product.prix,
              description: product.description || null,
              image: product.image || null,
              note: product.note || null,
              restaurant_id: bridgeRestaurantId, // Utiliser l'ID Bridge+ du restaurant
              categorie_id: product.categorie_id,
              accompagnants: product.accompagnants ? JSON.stringify(product.accompagnants) : '[]',
              mafalia_product_id: product.id
            }])
            .select('id')
            .single();

          if (createError) {
            console.error(`Erreur lors de la création du produit ${product.id}:`, createError);
            continue;
          }

          produitsMapping[product.id] = newProduct.id;
        }

        processedCount++;
      } catch (productError) {
        console.error(`Erreur lors du traitement du produit ${product.id}:`, productError);
        continue;
      }
    }

    const processingTime = (Date.now() - startTime) / 1000;

    // Logger la synchronisation
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'bridge-plus-sync',
      restaurantId,
      batchId,
      action: 'sync_batch',
      productsCount: products.length,
      processedCount,
      processingTime,
      status: 'success'
    }));

    return createCorsResponse({
      success: true,
      message: 'Lot traité avec succès',
      data: {
        produits_mapping: produitsMapping,
        batchId,
        processedCount
      }
    });

  } catch (error: any) {
    const processingTime = (Date.now() - startTime) / 1000;
    
    console.error('Erreur lors de la synchronisation du lot:', error);
    
    // Logger l'erreur
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'bridge-plus-sync',
      action: 'sync_batch',
      processingTime,
      status: 'error',
      error: {
        code: BridgePlusErrorCode.DATABASE_ERROR,
        message: error.message
      }
    }));

    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la synchronisation du lot',
      error: {
        code: BridgePlusErrorCode.DATABASE_ERROR,
        message: error.message
      }
    }, 500);
  }
}
