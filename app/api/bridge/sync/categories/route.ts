import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';

export const dynamic = 'force-dynamic';

interface MafaliaCategory {
  id: string;
  nom_categorie: string;
}

interface SyncResponse {
  success: boolean;
  message: string;
  data?: {
    categories_mapping: Record<string, string>;
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

    const categories: MafaliaCategory[] = await request.json();

    // Validation des données
    if (!Array.isArray(categories)) {
      return NextResponse.json({
        success: false,
        message: 'Format de données invalide',
        error: 'Array de catégories attendu'
      }, { status: 400 });
    }

    const categoriesMapping: Record<string, string> = {};

    for (const category of categories) {
      if (!category.id || !category.nom_categorie) {
        continue; // Ignorer les catégories invalides
      }

      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('mafalia_category_id', category.id)
        .single();

      if (existingCategory) {
        // Mettre à jour la catégorie existante
        await supabase
          .from('categories')
          .update({ nom_categorie: category.nom_categorie })
          .eq('mafalia_category_id', category.id);
        
        categoriesMapping[category.id] = existingCategory.id;
      } else {
        // Créer une nouvelle catégorie
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            nom_categorie: category.nom_categorie,
            mafalia_category_id: category.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        categoriesMapping[category.id] = newCategory.id;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${Object.keys(categoriesMapping).length} catégories synchronisées`,
      data: {
        categories_mapping: categoriesMapping
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la synchronisation des catégories:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la synchronisation des catégories',
      error: error.message
    }, { status: 500 });
  }
}
