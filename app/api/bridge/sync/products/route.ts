import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

interface MafaliaProduct {
  id: string;
  nom_produit: string;
  prix: number;
  description?: string;
  image?: string;
  note?: number;
  restaurant_id: string;
  categorie_id?: string;
  accompagnants?: string[];
}

interface SyncResponse {
  success: boolean;
  message: string;
  data?: {
    produits_mapping: Record<string, string>;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponse>> {
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return NextResponse.json(authCheck.error, { status: 401 });
    }

    const produits: MafaliaProduct[] = await request.json();

    // Validation des données
    if (!Array.isArray(produits)) {
      return NextResponse.json({
        success: false,
        message: 'Format de données invalide',
        error: 'Array de produits attendu'
      }, { status: 400 });
    }

    const produitsMapping: Record<string, string> = {};

    for (const produit of produits) {
      if (!produit.id || !produit.nom_produit || !produit.prix || !produit.restaurant_id) {
        continue; // Ignorer les produits invalides
      }

      // Vérifier que le restaurant existe
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('mafalia_restaurant_id', produit.restaurant_id)
        .single();

      if (!restaurant) {
        console.warn(`Restaurant avec ID Mafalia ${produit.restaurant_id} non trouvé`);
        continue;
      }

      // Vérifier la catégorie si fournie
      let categorieId = null;
      if (produit.categorie_id) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('mafalia_category_id', produit.categorie_id)
          .single();
        
        if (category) {
          categorieId = category.id;
        }
      }

      const { data: existingProduct } = await supabase
        .from('produits')
        .select('id')
        .eq('mafalia_product_id', produit.id)
        .single();

      if (existingProduct) {
        // Mettre à jour le produit existant
        await supabase
          .from('produits')
          .update({
            nom_produit: produit.nom_produit,
            prix: produit.prix,
            description: produit.description,
            image: produit.image,
            note: produit.note,
            categorie_id: categorieId,
            accompagnants: produit.accompagnants || []
          })
          .eq('mafalia_product_id', produit.id);
        
        produitsMapping[produit.id] = existingProduct.id;
      } else {
        // Créer un nouveau produit
        const { data: newProduct, error: createError } = await supabase
          .from('produits')
          .insert({
            nom_produit: produit.nom_produit,
            prix: produit.prix,
            description: produit.description,
            image: produit.image,
            note: produit.note,
            restaurant_id: restaurant.id,
            categorie_id: categorieId,
            accompagnants: produit.accompagnants || [],
            mafalia_product_id: produit.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        produitsMapping[produit.id] = newProduct.id;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${Object.keys(produitsMapping).length} produits synchronisés`,
      data: {
        produits_mapping: produitsMapping
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la synchronisation des produits:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la synchronisation des produits',
      error: error.message
    }, { status: 500 });
  }
}
