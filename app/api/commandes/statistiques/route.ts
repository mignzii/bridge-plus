import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { checkAuth } from '@/lib/auth-middleware';
import { createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

// GET - Récupérer les statistiques des commandes
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overview';
    const restaurantId = url.searchParams.get('restaurantId');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const period = url.searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y

    let responseData: any = {};

    switch (type) {
      case 'overview':
        responseData = await getOverviewStats(restaurantId, dateFrom, dateTo);
        break;
      case 'daily':
        responseData = await getDailyStats(restaurantId, dateFrom, dateTo);
        break;
      case 'restaurants':
        responseData = await getRestaurantStats(restaurantId, dateFrom, dateTo);
        break;
      case 'status':
        responseData = await getStatusStats(restaurantId, dateFrom, dateTo);
        break;
      case 'revenue':
        responseData = await getRevenueStats(restaurantId, dateFrom, dateTo, period);
        break;
      default:
        return createCorsResponse({
          success: false,
          message: 'Type de statistiques non supporté',
          error: 'Types supportés: overview, daily, restaurants, status, revenue'
        }, 400);
    }

    return createCorsResponse({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    }, 500);
  }
}

// Statistiques générales
async function getOverviewStats(restaurantId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  let query = supabase
    .from('commandes')
    .select('*', { count: 'exact' });

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data: commandes, error } = await query;
  if (error) throw error;

  const totalCommandes = commandes?.length || 0;
  const commandesLivrees = commandes?.filter(c => c.statut === 'livree').length || 0;
  const commandesEnCours = commandes?.filter(c => ['en_attente', 'confirmee', 'en_preparation', 'prete', 'en_livraison'].includes(c.statut)).length || 0;
  const commandesAnnulees = commandes?.filter(c => c.statut === 'annulee').length || 0;
  
  const chiffreAffaires = commandes?.filter(c => c.statut === 'livree').reduce((sum, c) => sum + Number(c.total), 0) || 0;
  const panierMoyen = commandesLivrees > 0 ? chiffreAffaires / commandesLivrees : 0;

  return {
    totalCommandes,
    commandesLivrees,
    commandesEnCours,
    commandesAnnulees,
    chiffreAffaires,
    panierMoyen,
    tauxConversion: totalCommandes > 0 ? (commandesLivrees / totalCommandes) * 100 : 0
  };
}

// Statistiques par jour
async function getDailyStats(restaurantId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  let query = supabase
    .from('commandes_statistiques')
    .select('*')
    .order('date_commande', { ascending: true });

  if (dateFrom) {
    query = query.gte('date_commande', dateFrom);
  }
  if (dateTo) {
    query = query.lte('date_commande', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

// Statistiques par restaurant
async function getRestaurantStats(restaurantId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  let query = supabase
    .from('restaurants_statistiques')
    .select('*');

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

// Statistiques par statut
async function getStatusStats(restaurantId?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  let query = supabase
    .from('commandes')
    .select('statut');

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data: commandes, error } = await query;
  if (error) throw error;

  const statusCounts = commandes?.reduce((acc: any, commande) => {
    acc[commande.statut] = (acc[commande.statut] || 0) + 1;
    return acc;
  }, {}) || {};

  return statusCounts;
}

// Statistiques de revenus
async function getRevenueStats(restaurantId?: string | null, dateFrom?: string | null, dateTo?: string | null, period?: string) {
  // Définir la période par défaut si non spécifiée
  if (!dateFrom && !dateTo) {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    dateTo = now.toISOString();
  }

  let query = supabase
    .from('commandes')
    .select('total, created_at, statut')
    .eq('statut', 'livree');

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data: commandes, error } = await query;
  if (error) throw error;

  const totalRevenue = commandes?.reduce((sum, c) => sum + Number(c.total), 0) || 0;
  const averageOrderValue = commandes?.length ? totalRevenue / commandes.length : 0;

  // Revenus par jour
  const revenueByDay = commandes?.reduce((acc: any, commande) => {
    const date = new Date(commande.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + Number(commande.total);
    return acc;
  }, {}) || {};

  return {
    totalRevenue,
    averageOrderValue,
    totalOrders: commandes?.length || 0,
    revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue
    }))
  };
}
