/**
 * Système de monitoring et logs pour l'intégration Bridge+ ↔ Mafalia
 * Version 1.0 - 27 Janvier 2025
 */

import { SyncMetrics, SyncLog, LogLevel, SyncStatus } from '@/types/bridge-mafalia-contract';

// ============================================================================
// TYPES
// ============================================================================

export interface MonitoringConfig {
  enableLogging: boolean;
  enableMetrics: boolean;
  logLevel: LogLevel;
  maxLogEntries: number;
  metricsRetentionDays: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
  restaurantId?: string;
  batchId?: string;
  productCount?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  lastError?: string;
  lastErrorTime?: string;
}

// ============================================================================
// GESTIONNAIRE DE MONITORING
// ============================================================================

export class MonitoringService {
  private static instance: MonitoringService;
  private logs: SyncLog[] = [];
  private metrics: PerformanceMetrics[] = [];
  private config: MonitoringConfig;
  private startTime: number;

  private constructor(config: MonitoringConfig = {
    enableLogging: true,
    enableMetrics: true,
    logLevel: 'INFO',
    maxLogEntries: 10000,
    metricsRetentionDays: 7
  }) {
    this.config = config;
    this.startTime = Date.now();
    this.startCleanupInterval();
  }

  public static getInstance(config?: MonitoringConfig): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService(config);
    }
    return MonitoringService.instance;
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  public log(
    level: LogLevel,
    action: string,
    context: {
      restaurantId?: string;
      batchId?: string;
      productsCount?: number;
      processingTime?: number;
      status: SyncStatus;
      error?: any;
    }
  ): void {
    if (!this.config.enableLogging) return;

    // Vérifier le niveau de log
    if (!this.shouldLog(level)) return;

    const logEntry: SyncLog = {
      timestamp: new Date().toISOString(),
      level,
      service: 'bridge-plus-sync',
      restaurantId: context.restaurantId,
      batchId: context.batchId,
      action,
      productsCount: context.productsCount,
      processingTime: context.processingTime,
      status: context.status,
      error: context.error
    };

    // Ajouter le log
    this.logs.push(logEntry);

    // Logger dans la console
    console.log(JSON.stringify(logEntry, null, 2));

    // Limiter la taille des logs
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }
  }

  public logInfo(
    action: string,
    context: {
      restaurantId?: string;
      batchId?: string;
      productsCount?: number;
      processingTime?: number;
      status: SyncStatus;
    }
  ): void {
    this.log('INFO', action, context);
  }

  public logWarn(
    action: string,
    context: {
      restaurantId?: string;
      batchId?: string;
      productsCount?: number;
      processingTime?: number;
      status: SyncStatus;
      error?: any;
    }
  ): void {
    this.log('WARN', action, context);
  }

  public logError(
    action: string,
    context: {
      restaurantId?: string;
      batchId?: string;
      productsCount?: number;
      processingTime?: number;
      status: SyncStatus;
      error: any;
    }
  ): void {
    this.log('ERROR', action, context);
  }

  // ============================================================================
  // MÉTRIQUES DE PERFORMANCE
  // ============================================================================

  public recordMetric(metric: PerformanceMetrics): void {
    if (!this.config.enableMetrics) return;

    this.metrics.push(metric);

    // Limiter la taille des métriques
    const maxMetrics = this.config.maxLogEntries * 10; // 10x plus de métriques que de logs
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }

  public recordEndpointCall(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    context?: {
      restaurantId?: string;
      batchId?: string;
      productCount?: number;
    }
  ): void {
    this.recordMetric({
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString(),
      restaurantId: context?.restaurantId,
      batchId: context?.batchId,
      productCount: context?.productCount
    });
  }

  // ============================================================================
  // MÉTRIQUES DE SYNCHRONISATION
  // ============================================================================

  public getSyncMetrics(restaurantId?: string): SyncMetrics[] {
    const logs = restaurantId 
      ? this.logs.filter(log => log.restaurantId === restaurantId)
      : this.logs;

    const metrics: SyncMetrics[] = [];
    const restaurantGroups = new Map<string, SyncLog[]>();

    // Grouper par restaurant
    logs.forEach(log => {
      if (log.restaurantId) {
        if (!restaurantGroups.has(log.restaurantId)) {
          restaurantGroups.set(log.restaurantId, []);
        }
        restaurantGroups.get(log.restaurantId)!.push(log);
      }
    });

    // Calculer les métriques pour chaque restaurant
    restaurantGroups.forEach((restaurantLogs, rid) => {
      const syncLogs = restaurantLogs.filter(log => log.action.includes('sync'));
      const batchLogs = syncLogs.filter(log => log.action === 'sync_batch');
      const errorLogs = restaurantLogs.filter(log => log.status === 'error');

      const totalProducts = batchLogs.reduce((sum, log) => sum + (log.productsCount || 0), 0);
      const totalBatches = batchLogs.length;
      const totalProcessingTime = batchLogs.reduce((sum, log) => sum + (log.processingTime || 0), 0);
      const successRate = totalBatches > 0 ? ((totalBatches - errorLogs.length) / totalBatches) * 100 : 100;
      const lastSyncTime = syncLogs.length > 0 ? syncLogs[syncLogs.length - 1].timestamp : '';

      metrics.push({
        restaurantId: rid,
        totalProducts,
        totalBatches,
        processingTime: totalProcessingTime,
        successRate,
        errorCount: errorLogs.length,
        lastSyncTime
      });
    });

    return metrics;
  }

  // ============================================================================
  // SANTÉ DU SYSTÈME
  // ============================================================================

  public getSystemHealth(): SystemHealth {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    
    // Calculer le statut de santé basé sur les erreurs récentes
    const recentErrors = this.logs.filter(log => 
      log.level === 'ERROR' && 
      new Date(log.timestamp).getTime() > Date.now() - 300000 // 5 minutes
    );

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (recentErrors.length > 10) {
      status = 'unhealthy';
    } else if (recentErrors.length > 5) {
      status = 'degraded';
    }

    const lastError = recentErrors.length > 0 ? recentErrors[recentErrors.length - 1] : null;

    return {
      status,
      uptime,
      memoryUsage,
      activeConnections: 0, // À implémenter si nécessaire
      lastError: lastError?.error?.message,
      lastErrorTime: lastError?.timestamp
    };
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  public getStats(): {
    totalLogs: number;
    totalMetrics: number;
    logsByLevel: Record<LogLevel, number>;
    logsByStatus: Record<SyncStatus, number>;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  } {
    const logsByLevel: Record<LogLevel, number> = {
      INFO: 0,
      WARN: 0,
      ERROR: 0
    };

    const logsByStatus: Record<SyncStatus, number> = {
      success: 0,
      error: 0,
      retry: 0
    };

    this.logs.forEach(log => {
      logsByLevel[log.level]++;
      logsByStatus[log.status]++;
    });

    const totalMetrics = this.metrics.length;
    const averageResponseTime = totalMetrics > 0 
      ? this.metrics.reduce((sum, metric) => sum + metric.responseTime, 0) / totalMetrics
      : 0;

    const totalLogs = this.logs.length;
    const errorRate = totalLogs > 0 ? (logsByStatus.error / totalLogs) * 100 : 0;

    return {
      totalLogs,
      totalMetrics,
      logsByLevel,
      logsByStatus,
      averageResponseTime,
      errorRate,
      uptime: Date.now() - this.startTime
    };
  }

  // ============================================================================
  // NETTOYAGE
  // ============================================================================

  private startCleanupInterval(): void {
    // Nettoyer les anciens logs et métriques toutes les heures
    setInterval(() => {
      this.cleanupOldEntries();
    }, 60 * 60 * 1000);
  }

  private cleanupOldEntries(): void {
    const cutoffTime = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);

    // Nettoyer les logs anciens
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoffTime
    );

    // Nettoyer les métriques anciennes
    this.metrics = this.metrics.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoffTime
    );
  }

  // ============================================================================
  // UTILITAIRES
  // ============================================================================

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['ERROR', 'WARN', 'INFO'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  // ============================================================================
  // EXPORT DES DONNÉES
  // ============================================================================

  public exportLogs(restaurantId?: string, limit: number = 1000): SyncLog[] {
    let filteredLogs = this.logs;
    
    if (restaurantId) {
      filteredLogs = filteredLogs.filter(log => log.restaurantId === restaurantId);
    }
    
    return filteredLogs.slice(-limit);
  }

  public exportMetrics(restaurantId?: string, limit: number = 1000): PerformanceMetrics[] {
    let filteredMetrics = this.metrics;
    
    if (restaurantId) {
      filteredMetrics = filteredMetrics.filter(metric => metric.restaurantId === restaurantId);
    }
    
    return filteredMetrics.slice(-limit);
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function createMonitoringMiddleware() {
  const monitoring = MonitoringService.getInstance();

  return {
    logRequest: (action: string, context: any) => {
      monitoring.logInfo(action, context);
    },
    
    logError: (action: string, context: any) => {
      monitoring.logError(action, context);
    },
    
    recordMetric: (endpoint: string, method: string, responseTime: number, statusCode: number, context?: any) => {
      monitoring.recordEndpointCall(endpoint, method, responseTime, statusCode, context);
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MonitoringService;
