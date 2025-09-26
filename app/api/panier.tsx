import { supabase } from '@/lib/supabaseClient';

export async function getPanier(){
    const{data, error}=await supabase
    .from('panier')
    .select('*')
    .order('created_at')
    if(error) throw error;
    return data
}

export async function createPanier(produitData: {
sous_total: number;
rabais: number;
total: number;
code_promo: string;
total_items: number;
frais_livraison: number;
}) {
  const { data, error } = await supabase
    .from('panier')
    .insert({
    sous_total: produitData.sous_total,
    rabais: produitData.rabais,
    total: produitData.total,
    code_promo: produitData.code_promo,
    total_items: produitData.total_items,
    frais_livraison: produitData.frais_livraison
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase:', error);
    throw error;
  }

  return data;
}

export async function updatePanier(id: number, updates: any) {
  const { data, error } = await supabase
    .from('panier')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePanier(id: number) {
  const { error } = await supabase
    .from('panier')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function getCartWithItems(panierId: string) {
  const { data, error } = await supabase
    .from('panier')
    .select(`
      *,
      panier_item (
        id,
        produit_id,
        produit_nom,
        quantite,
        prix_unitaire,
        image,
        accompagnant,
        categorie_id
      )
    `)
    .eq('id', panierId)
    .single();

  if (error) throw error;
  return data;
}

export const clearCart = async (panierId: string) => {
  try {
    const { error: deleteError } = await supabase
      .from("panier_item")
      .delete()
      .eq("panier_id", panierId);

    if (deleteError) {
      console.error("Erreur lors de la suppression des items du panier:", deleteError);
      throw deleteError;
    }

    const { data, error: updateError } = await supabase
      .from("panier")
      .update({
        total_items: 0,
        sous_total: 0,
        rabais: 0,
        frais_livraison: 0,
        total: 0,
      })
      .eq("id", panierId)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour du panier:", updateError);
      throw updateError;
    }

    return data;
  } catch (error) {
    console.error("Erreur dans clearCart:", error);
    throw error;
  }
};



export async function updateCartItemQuantity(itemId: string, newQuantity: number, prixUnitaire: number) {
  const newTotal = newQuantity * prixUnitaire;
  
  const { data, error } = await supabase
    .from('panier_item')
    .update({ 
      quantite: newQuantity,
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCartItem(itemId: string) {
  const { error } = await supabase
    .from('panier_item')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
  return { success: true };
}

export async function updateCartTotals(panierId: string) {
  const { data: items, error: itemsError } = await supabase
    .from('panier_item')
    .select('quantite, prix_unitaire')
    .eq('panier_id', panierId);

  if (itemsError) throw itemsError;

  const totalItems = items.reduce((sum, item) => sum + item.quantite, 0);
  const sousTotal = items.reduce((sum, item) => sum + item.quantite * item.prix_unitaire, 0);
  const rabais = 0.2 * sousTotal; 
  const fraisLivraison = 2000; 
  const total = sousTotal + fraisLivraison - rabais;

  const { data, error } = await supabase
    .from('panier') 
    .update({
      total_items: totalItems,
      sous_total: sousTotal,
      rabais,
      frais_livraison: fraisLivraison,
      total,
    })
    .eq('id', panierId)
    .select()
    .single();

  if (error) throw error;
  return data;
}