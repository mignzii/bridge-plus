import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth-middleware';
import { createCorsResponse, createCorsOptionsResponse } from '@/lib/cors';
import MonitoringService from '@/lib/monitoring';
import RateLimiter from '@/lib/rate-limiter';
import BridgePlusErrorHandler from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return createCorsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authCheck = checkAuth(request);
    if (!authCheck.isValid) {
      return createCorsResponse(authCheck.error, 401);
    }

    const monitoring = MonitoringService.getInstance();
    const rateLimiter = RateLimiter.getInstance();
    const errorHandler = BridgePlusErrorHandler.getInstance();

    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overview';
    const restaurantId = url.searchParams.get('restaurantId');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let responseData: any = {};

    switch (type) {
      case 'overview':
        responseData = {
          systemHealth: monitoring.getSystemHealth(),
          stats: monitoring.getStats(),
          rateLimitStats: rateLimiter.getStats(),
          errorStats: errorHandler.getErrorStats()
        };
        break;

      case 'sync-metrics':
        responseData = {
          syncMetrics: monitoring.getSyncMetrics(restaurantId || undefined)
        };
        break;

      case 'logs':
        responseData = {
          logs: monitoring.exportLogs(restaurantId || undefined, limit)
        };
        break;

      case 'performance':
        responseData = {
          metrics: monitoring.exportMetrics(restaurantId || undefined, limit)
        };
        break;

      case 'errors':
        responseData = {
          errors: restaurantId 
            ? errorHandler.getErrorLogsByRestaurant(restaurantId, limit)
            : errorHandler.getErrorLogs(limit)
        };
        break;

      case 'rate-limits':
        responseData = {
          rateLimitStats: rateLimiter.getStats(),
          restaurantStats: restaurantId 
            ? rateLimiter.getRestaurantStats(restaurantId)
            : null
        };
        break;

      default:
        return createCorsResponse({
          success: false,
          message: 'Type de monitoring non supporté',
          error: {
            code: 'INVALID_TYPE',
            message: 'Types supportés: overview, sync-metrics, logs, performance, errors, rate-limits'
          }
        }, 400);
    }

    return createCorsResponse({
      success: true,
      message: 'Données de monitoring récupérées',
      data: responseData
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des données de monitoring:', error);
    
    return createCorsResponse({
      success: false,
      message: 'Erreur lors de la récupération des données de monitoring',
      error: {
        code: 'MONITORING_ERROR',
        message: error.message
      }
    }, 500);
  }
}
