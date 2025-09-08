import { supabase } from '@/lib/supabaseClient';

export async function getRestaurants(){
    const{data, error}=await supabase
    .from('restaurants')
    .select('*')
    .order('created_at')
    if(error) throw error;
    return data
}

export async function createRestaurants(restaurantData: {
  nom_restaurant: string;
  image: string;
  statut: string;
}) {
  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      nom_restaurant: restaurantData.nom_restaurant,
      image: restaurantData.image,
      statut: restaurantData.statut
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase:', error);
    throw error;
  }

  return data;
}

export async function updateRestaurant(id: number, updates: any) {
  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRestaurant(id: number) {
  const { error } = await supabase
    .from('restaurants')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
