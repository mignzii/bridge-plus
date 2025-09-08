import { supabase } from '@/lib/supabaseClient';

export async function getCategories(){
    const{data, error}=await supabase
    .from('categories')
    .select('*')
    .order('created_at')
    if(error) throw error;
    return data
}

export async function createCCategories(categorieData: {
  nom_categorie: string;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      nom_categorie: categorieData.nom_categorie,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase:', error);
    throw error;
  }

  return data;
}

export async function updateCategorie(id: number, updates: any) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategorie(id: number) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
