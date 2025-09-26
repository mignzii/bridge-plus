/**
 * Système de rate limiting pour l'intégration Bridge+ ↔ Mafalia
 * Version 1.0 - 27 Janvier 2025
 */

import { NextRequest } from 'next/server';
import { RATE_LIMITS } from '@/types/bridge-mafalia-contract';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  requestsPerMinute: number;
  batchesPerMinute: number;
  productsPerMinute: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// ============================================================================
// GESTIONNAIRE DE RATE LIMITING
// ============================================================================

export class RateLimiter {
  private static instance: RateLimiter;
  private requestCounts: Map<string, RateLimitEntry> = new Map();
  private batchCounts: Map<string, RateLimitEntry> = new Map();
  private productCounts: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  private constructor(config: RateLimitConfig = RATE_LIMITS) {
    this.config = config;
    this.startCleanupInterval();
  }

  public static getInstance(config?: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }

  // ============================================================================
  // VÉRIFICATION DES LIMITES
  // ============================================================================

  public checkRequestLimit(
    identifier: string,
    windowMs: number = 60000 // 1 minute
  ): RateLimitResult {
    const key = `requests:${identifier}`;
    const now = Date.now();
    const resetTime = now + windowMs;

    const entry = this.requestCounts.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre ou première requête
      this.requestCounts.set(key, {
        count: 1,
        resetTime,
        lastRequest: now
      });
      
      return {
        allowed: true,
        remaining: this.config.requestsPerMinute - 1,
        resetTime
      };
    }

    if (entry.count >= this.config.requestsPerMinute) {
      // Limite atteinte
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Incrémenter le compteur
    entry.count++;
    entry.lastRequest = now;
    this.requestCounts.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.requestsPerMinute - entry.count,
      resetTime: entry.resetTime
    };
  }

  public checkBatchLimit(
    restaurantId: string,
    windowMs: number = 60000 // 1 minute
  ): RateLimitResult {
    const key = `batches:${restaurantId}`;
    const now = Date.now();
    const resetTime = now + windowMs;

    const entry = this.batchCounts.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre ou premier lot
      this.batchCounts.set(key, {
        count: 1,
        resetTime,
        lastRequest: now
      });
      
      return {
        allowed: true,
        remaining: this.config.batchesPerMinute - 1,
        resetTime
      };
    }

    if (entry.count >= this.config.batchesPerMinute) {
      // Limite atteinte
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Incrémenter le compteur
    entry.count++;
    entry.lastRequest = now;
    this.batchCounts.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.batchesPerMinute - entry.count,
      resetTime: entry.resetTime
    };
  }

  public checkProductLimit(
    restaurantId: string,
    productCount: number,
    windowMs: number = 60000 // 1 minute
  ): RateLimitResult {
    const key = `products:${restaurantId}`;
    const now = Date.now();
    const resetTime = now + windowMs;

    const entry = this.productCounts.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Nouvelle fenêtre ou premiers produits
      this.productCounts.set(key, {
        count: productCount,
        resetTime,
        lastRequest: now
      });
      
      return {
        allowed: true,
        remaining: this.config.productsPerMinute - productCount,
        resetTime
      };
    }

    const newCount = entry.count + productCount;
    
    if (newCount > this.config.productsPerMinute) {
      // Limite atteinte
      return {
        allowed: false,
        remaining: Math.max(0, this.config.productsPerMinute - entry.count),
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Incrémenter le compteur
    entry.count = newCount;
    entry.lastRequest = now;
    this.productCounts.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.productsPerMinute - entry.count,
      resetTime: entry.resetTime
    };
  }

  // ============================================================================
  // VÉRIFICATION COMPLÈTE
  // ============================================================================

  public checkAllLimits(
    identifier: string,
    restaurantId: string,
    productCount: number = 0
  ): {
    requests: RateLimitResult;
    batches: RateLimitResult;
    products: RateLimitResult;
    overallAllowed: boolean;
  } {
    const requests = this.checkRequestLimit(identifier);
    const batches = this.checkBatchLimit(restaurantId);
    const products = this.checkProductLimit(restaurantId, productCount);

    const overallAllowed = requests.allowed && batches.allowed && products.allowed;

    return {
      requests,
      batches,
      products,
      overallAllowed
    };
  }

  // ============================================================================
  // NETTOYAGE AUTOMATIQUE
  // ============================================================================

  private startCleanupInterval(): void {
    // Nettoyer les entrées expirées toutes les 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    // Nettoyer les compteurs de requêtes
    this.requestCounts.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.requestCounts.delete(key);
      }
    });

    // Nettoyer les compteurs de lots
    this.batchCounts.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.batchCounts.delete(key);
      }
    });

    // Nettoyer les compteurs de produits
    this.productCounts.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.productCounts.delete(key);
      }
    });
  }

  // ============================================================================
  // STATISTIQUES
  // ============================================================================

  public getStats(): {
    activeRequestKeys: number;
    activeBatchKeys: number;
    activeProductKeys: number;
    config: RateLimitConfig;
  } {
    return {
      activeRequestKeys: this.requestCounts.size,
      activeBatchKeys: this.batchCounts.size,
      activeProductKeys: this.productCounts.size,
      config: this.config
    };
  }

  public getRestaurantStats(restaurantId: string): {
    batches: RateLimitEntry | null;
    products: RateLimitEntry | null;
  } {
    return {
      batches: this.batchCounts.get(`batches:${restaurantId}`) || null,
      products: this.productCounts.get(`products:${restaurantId}`) || null
    };
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function getClientIdentifier(request: NextRequest): string {
  // Utiliser l'IP du client comme identifiant
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  return ip;
}

export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
  };
}

// ============================================================================
// MIDDLEWARE DE RATE LIMITING
// ============================================================================

export function createRateLimitMiddleware() {
  const rateLimiter = RateLimiter.getInstance();

  return async (request: NextRequest, restaurantId?: string, productCount?: number) => {
    const identifier = getClientIdentifier(request);
    const limits = rateLimiter.checkAllLimits(
      identifier,
      restaurantId || 'unknown',
      productCount || 0
    );

    if (!limits.overallAllowed) {
      // Déterminer quelle limite a été dépassée
      let retryAfter = 0;
      if (!limits.requests.allowed) {
        retryAfter = limits.requests.retryAfter || 60;
      } else if (!limits.batches.allowed) {
        retryAfter = limits.batches.retryAfter || 60;
      } else if (!limits.products.allowed) {
        retryAfter = limits.products.retryAfter || 60;
      }

      return {
        allowed: false,
        retryAfter,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': retryAfter.toString()
        }
      };
    }

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Remaining': Math.min(
          limits.requests.remaining,
          limits.batches.remaining,
          limits.products.remaining
        ).toString()
      }
    };
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RateLimiter;
