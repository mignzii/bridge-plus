import { supabase } from '@/lib/supabaseClient';

export async function getfileAttente(){
    const{data, error}=await supabase
    .from('fileAttente')
    .select('*')
    .order('created_at')
    if(error) throw error;
    return data
}

export async function createfileAttente(fileAttenteData: {
  nom_complet: string;
  email: string;
  numeroPhone: string;
  isCondition: boolean;
}) {
  const { data, error } = await supabase
    .from('fileAttente')
    .insert({
      nom_complet: fileAttenteData.nom_complet,
      email: fileAttenteData.email,
      numeroPhone: fileAttenteData.numeroPhone,
      isCondition: fileAttenteData.isCondition
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur Supabase:', error);
    throw error;
  }

  return data;
}

export async function updateFileAttente(id: number, updates: any) {
  const { data, error } = await supabase
    .from('fileAttente')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFileAttente(id: number) {
  const { error } = await supabase
    .from('fileAttente')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
