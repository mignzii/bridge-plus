import { supabase } from '@/lib/supabaseClient';

export async function getProduits(){
    const{data, error}=await supabase
    .from('produits')
    .select('*')
    .order('created_at')
    if(error) throw error;
    return data
}

export async function createProduits(produitData: {
  nom_produit: string;
  image: string;
  description: string;
  prix: number;
  accompagnants: string[];
  note: number;
  restaurant_id: string;
  categorie_id: string;
}) {
  const { data, error } = await supabase
    .from('produits')
    .insert({
      nom_produit: produitData.nom_produit,
      image: produitData.image,
      description: produitData.description,
      prix: produitData.prix,
      accompagnants: produitData.accompagnants,
      note: produitData.note,
      restaurant_id: produitData.restaurant_id,
      categorie_id: produitData.categorie_id
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase:', error);
    throw error;
  }

  return data;
}

export async function updateProduit(id: number, updates: any) {
  const { data, error } = await supabase
    .from('produits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduit(id: number) {
  const { error } = await supabase
    .from('produits')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
