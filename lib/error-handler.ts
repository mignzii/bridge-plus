/**
 * Gestionnaire d'erreurs standardisé pour l'intégration Bridge+ ↔ Mafalia
 * Version 1.0 - 27 Janvier 2025
 */

import { NextResponse } from 'next/server';
import { BridgePlusError, BridgePlusErrorCode } from '@/types/bridge-mafalia-contract';
import { createCorsResponse } from '@/lib/cors';

// ============================================================================
// TYPES D'ERREURS
// ============================================================================

export interface ErrorContext {
  restaurantId?: string;
  batchId?: string;
  productId?: string;
  categoryId?: string;
  action?: string;
  timestamp?: string;
}

export interface ErrorLog {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  service: string;
  error: BridgePlusError;
  context?: ErrorContext;
  stack?: string;
}

// ============================================================================
// GESTIONNAIRE D'ERREURS PRINCIPAL
// ============================================================================

export class BridgePlusErrorHandler {
  private static instance: BridgePlusErrorHandler;
  private errorLogs: ErrorLog[] = [];

  private constructor() {}

  public static getInstance(): BridgePlusErrorHandler {
    if (!BridgePlusErrorHandler.instance) {
      BridgePlusErrorHandler.instance = new BridgePlusErrorHandler();
    }
    return BridgePlusErrorHandler.instance;
  }

  // ============================================================================
  // CRÉATION D'ERREURS STANDARDISÉES
  // ============================================================================

  public createError(
    code: BridgePlusErrorCode,
    message: string,
    details?: any,
    context?: ErrorContext
  ): BridgePlusError {
    const error: BridgePlusError = {
      code,
      message,
      details
    };

    // Logger l'erreur
    this.logError(error, context);

    return error;
  }

  // ============================================================================
  // GESTION DES ERREURS D'AUTHENTIFICATION
  // ============================================================================

  public handleAuthError(): NextResponse {
    const error = this.createError(
      BridgePlusErrorCode.INVALID_TOKEN,
      'Token d\'authentification invalide ou manquant'
    );

    return createCorsResponse({
      success: false,
      message: 'Erreur d\'authentification',
      error
    }, 401);
  }

  // ============================================================================
  // GESTION DES ERREURS DE VALIDATION
  // ============================================================================

  public handleValidationError(
    message: string,
    details?: any,
    context?: ErrorContext
  ): NextResponse {
    const error = this.createError(
      BridgePlusErrorCode.VALIDATION_ERROR,
      message,
      details,
      context
    );

    return createCorsResponse({
      success: false,
      message: 'Erreur de validation',
      error
    }, 400);
  }

  // ============================================================================
  // GESTION DES ERREURS DE RESSOURCES NON TROUVÉES
  // ============================================================================

  public handleNotFoundError(
    resource: 'restaurant' | 'category' | 'product',
    id: string,
    context?: ErrorContext
  ): NextResponse {
    const code = resource === 'restaurant' 
      ? BridgePlusErrorCode.RESTAURANT_NOT_FOUND
      : resource === 'category'
      ? BridgePlusErrorCode.CATEGORY_NOT_FOUND
      : BridgePlusErrorCode.VALIDATION_ERROR;

    const message = `${resource === 'restaurant' ? 'Restaurant' : 
                     resource === 'category' ? 'Catégorie' : 'Produit'} avec ID ${id} introuvable`;

    const error = this.createError(code, message, { id }, context);

    return createCorsResponse({
      success: false,
      message: 'Ressource introuvable',
      error
    }, 404);
  }

  // ============================================================================
  // GESTION DES ERREURS DE BASE DE DONNÉES
  // ============================================================================

  public handleDatabaseError(
    originalError: any,
    context?: ErrorContext
  ): NextResponse {
    const error = this.createError(
      BridgePlusErrorCode.DATABASE_ERROR,
      'Erreur de base de données',
      {
        originalMessage: originalError.message,
        originalCode: originalError.code
      },
      context
    );

    return createCorsResponse({
      success: false,
      message: 'Erreur de base de données',
      error
    }, 500);
  }

  // ============================================================================
  // GESTION DES ERREURS DE TAILLE DE LOT
  // ============================================================================

  public handleBatchTooLargeError(
    batchSize: number,
    maxAllowed: number = 30,
    context?: ErrorContext
  ): NextResponse {
    const error = this.createError(
      BridgePlusErrorCode.BATCH_TOO_LARGE,
      `Le lot contient trop de produits (max: ${maxAllowed})`,
      {
        batchSize,
        maxAllowed
      },
      context
    );

    return createCorsResponse({
      success: false,
      message: 'Lot trop volumineux',
      error
    }, 400);
  }

  // ============================================================================
  // GESTION DES ERREURS DE TIMEOUT
  // ============================================================================

  public handleTimeoutError(
    timeoutMs: number,
    context?: ErrorContext
  ): NextResponse {
    const error = this.createError(
      BridgePlusErrorCode.TIMEOUT_ERROR,
      `Timeout dépassé (${timeoutMs}ms)`,
      { timeoutMs },
      context
    );

    return createCorsResponse({
      success: false,
      message: 'Timeout dépassé',
      error
    }, 408);
  }

  // ============================================================================
  // GESTION DES ERREURS GÉNÉRIQUES
  // ============================================================================

  public handleGenericError(
    originalError: any,
    context?: ErrorContext
  ): NextResponse {
    const error = this.createError(
      BridgePlusErrorCode.DATABASE_ERROR,
      'Erreur interne du serveur',
      {
        originalMessage: originalError.message,
        originalStack: originalError.stack
      },
      context
    );

    return createCorsResponse({
      success: false,
      message: 'Erreur interne du serveur',
      error
    }, 500);
  }

  // ============================================================================
  // LOGGING DES ERREURS
  // ============================================================================

  private logError(error: BridgePlusError, context?: ErrorContext): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'bridge-plus-sync',
      error,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      }
    };

    // Ajouter à la liste des logs
    this.errorLogs.push(errorLog);

    // Logger dans la console
    console.error(JSON.stringify(errorLog, null, 2));

    // Limiter la taille de la liste des logs (garder seulement les 1000 derniers)
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000);
    }
  }

  // ============================================================================
  // RÉCUPÉRATION DES LOGS D'ERREURS
  // ============================================================================

  public getErrorLogs(limit: number = 100): ErrorLog[] {
    return this.errorLogs.slice(-limit);
  }

  public getErrorLogsByCode(code: BridgePlusErrorCode, limit: number = 100): ErrorLog[] {
    return this.errorLogs
      .filter(log => log.error.code === code)
      .slice(-limit);
  }

  public getErrorLogsByRestaurant(restaurantId: string, limit: number = 100): ErrorLog[] {
    return this.errorLogs
      .filter(log => log.context?.restaurantId === restaurantId)
      .slice(-limit);
  }

  // ============================================================================
  // STATISTIQUES D'ERREURS
  // ============================================================================

  public getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<BridgePlusErrorCode, number>;
    errorsByRestaurant: Record<string, number>;
    recentErrors: ErrorLog[];
  } {
    const errorsByCode: Record<BridgePlusErrorCode, number> = {} as any;
    const errorsByRestaurant: Record<string, number> = {};

    // Initialiser les compteurs
    Object.values(BridgePlusErrorCode).forEach(code => {
      errorsByCode[code] = 0;
    });

    // Compter les erreurs
    this.errorLogs.forEach(log => {
      errorsByCode[log.error.code]++;
      
      if (log.context?.restaurantId) {
        errorsByRestaurant[log.context.restaurantId] = 
          (errorsByRestaurant[log.context.restaurantId] || 0) + 1;
      }
    });

    return {
      totalErrors: this.errorLogs.length,
      errorsByCode,
      errorsByRestaurant,
      recentErrors: this.errorLogs.slice(-10)
    };
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function handleError(
  error: any,
  context?: ErrorContext
): NextResponse {
  const errorHandler = BridgePlusErrorHandler.getInstance();

  // Déterminer le type d'erreur et la gérer appropriément
  if (error.code === 'PGRST116') {
    // Erreur de ressource non trouvée PostgreSQL
    return errorHandler.handleNotFoundError('restaurant', context?.restaurantId || 'unknown', context);
  } else if (error.code === '23505') {
    // Erreur de contrainte unique PostgreSQL
    return errorHandler.handleValidationError(
      'Violation de contrainte unique',
      { originalCode: error.code, originalMessage: error.message },
      context
    );
  } else if (error.code === '23503') {
    // Erreur de clé étrangère PostgreSQL
    return errorHandler.handleValidationError(
      'Violation de clé étrangère',
      { originalCode: error.code, originalMessage: error.message },
      context
    );
  } else {
    // Erreur générique
    return errorHandler.handleGenericError(error, context);
  }
}

export function createErrorResponse(
  code: BridgePlusErrorCode,
  message: string,
  details?: any,
  context?: ErrorContext,
  statusCode: number = 500
): NextResponse {
  const errorHandler = BridgePlusErrorHandler.getInstance();
  const error = errorHandler.createError(code, message, details, context);

  return createCorsResponse({
    success: false,
    message: 'Erreur',
    error
  }, statusCode);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BridgePlusErrorHandler;
