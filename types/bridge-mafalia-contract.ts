/**
 * Types TypeScript pour le contrat d'interface Bridge+ ↔ Mafalia
 * Version 1.0 - 27 Janvier 2025
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export interface Restaurant {
  id: string;                    // ID Mafalia (UUID) ou "uuid_centre_42" pour centre autonome (requis)
  nom_restaurant: string;        // Max 100 chars (requis)
  statut: 'ouvert' | 'ferme';    // Enum strict (requis)
  image?: string;                // URL valide, max 500 chars (optionnel)
}

export interface Category {
  id: string;                    // ID Mafalia (requis)
  nom_categorie: string;         // Max 50 chars (requis)
}

export interface Product {
  id: string;                    // ID Mafalia (requis)
  nom_produit: string;           // Max 100 chars (requis)
  prix: number;                  // 0-1000000 (requis)
  description?: string;          // Max 200 chars (optionnel)
  image?: string;                // URL valide, max 500 chars (optionnel)
  note?: number;                 // 0-5 (optionnel)
  restaurant_id: string;         // ID Mafalia du restaurant (requis)
  categorie_id: string;          // ID Mafalia de la catégorie (requis)
  accompagnants?: string[];      // Array de strings (optionnel)
}

// ============================================================================
// REQUÊTES API
// ============================================================================

export interface RestaurantSyncRequest {
  restaurant: Restaurant;
  categories: Category[];
}

export interface ProductsBatchRequest {
  products: Product[];
  batchId: string;               // ID unique du lot (requis)
  totalBatches: number;          // Nombre total de lots (requis)
  currentBatch: number;          // Numéro du lot actuel (requis)
  restaurantId: string;          // ID Mafalia du restaurant ou "uuid_centre_X" pour centre autonome (requis)
}

// ============================================================================
// RÉPONSES API
// ============================================================================

export interface RestaurantSyncResponse {
  success: boolean;
  message: string;
  data?: {
    restaurant_id: string;         // ID Bridge+ généré
    categories_mapping: Record<string, string>; // mafalia_id → bridge_id
  };
  error?: BridgePlusError;
}

export interface ProductsBatchResponse {
  success: boolean;
  message: string;
  data?: {
    produits_mapping: Record<string, string>; // mafalia_id → bridge_id
    batchId: string;
    processedCount: number;
  };
  error?: BridgePlusError;
}

export interface SyncStatusResponse {
  success: boolean;
  data?: {
    restaurantId: string;
    isComplete: boolean;
    processedBatches: number;
    totalBatches: number;
    lastBatchTime?: string;        // ISO 8601
    totalProducts: number;
  };
  error?: BridgePlusError;
}

// ============================================================================
// GESTION D'ERREURS
// ============================================================================

export interface BridgePlusError {
  code: BridgePlusErrorCode;
  message: string;
  details?: any;
}

export enum BridgePlusErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  RESTAURANT_NOT_FOUND = 'RESTAURANT_NOT_FOUND',
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  BATCH_TOO_LARGE = 'BATCH_TOO_LARGE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// ============================================================================
// CONFIGURATION DES LOTS
// ============================================================================

export interface BatchConfig {
  maxProducts: number;
  delayMs: number;
  timeoutMs: number;
}

export const BATCH_CONFIGS: Record<string, BatchConfig> = {
  'small': { maxProducts: 10, delayMs: 1000, timeoutMs: 60000 },      // ≤ 50 produits
  'medium': { maxProducts: 20, delayMs: 800, timeoutMs: 90000 },      // 51-200 produits
  'large': { maxProducts: 25, delayMs: 600, timeoutMs: 120000 },      // 201-500 produits
  'xlarge': { maxProducts: 30, delayMs: 500, timeoutMs: 180000 }      // 500+ produits
};

export function getBatchConfig(productCount: number): BatchConfig {
  if (productCount <= 50) return BATCH_CONFIGS.small;
  if (productCount <= 200) return BATCH_CONFIGS.medium;
  if (productCount <= 500) return BATCH_CONFIGS.large;
  return BATCH_CONFIGS.xlarge;
}

// ============================================================================
// VALIDATION DES DONNÉES
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  type?: 'string' | 'number' | 'boolean';
  format?: 'url' | 'email' | 'uuid';
}

export interface ProductValidation {
  nom_produit: ValidationRule;
  prix: ValidationRule;
  description: ValidationRule;
  image: ValidationRule;
  note: ValidationRule;
}

export const PRODUCT_VALIDATION: ProductValidation = {
  nom_produit: {
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-'àâäéèêëïîôöùûüÿçñ]+$/i,
    type: 'string'
  },
  prix: {
    required: true,
    min: 0,
    max: 1000000,
    type: 'number'
  },
  description: {
    required: false,
    maxLength: 200,
    type: 'string'
  },
  image: {
    required: false,
    format: 'url',
    maxLength: 500,
    type: 'string'
  },
  note: {
    required: false,
    min: 0,
    max: 5,
    type: 'number'
  }
};

// ============================================================================
// MONITORING ET MÉTRIQUES
// ============================================================================

export interface SyncMetrics {
  restaurantId: string;
  totalProducts: number;
  totalBatches: number;
  processingTime: number; // en secondes
  successRate: number; // pourcentage
  errorCount: number;
  lastSyncTime: string;
}

export interface SyncLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  restaurantId?: string;
  batchId?: string;
  action: string;
  productsCount?: number;
  processingTime?: number;
  status: 'success' | 'error' | 'retry';
  error?: BridgePlusError;
}

// ============================================================================
// CONFIGURATION DE PERFORMANCE
// ============================================================================

export interface PerformanceTarget {
  productCount: number;
  maxTimeSeconds: number;
  batchSize: number;
  delayMs: number;
}

export const PERFORMANCE_TARGETS: PerformanceTarget[] = [
  { productCount: 43, maxTimeSeconds: 8, batchSize: 10, delayMs: 1000 },
  { productCount: 500, maxTimeSeconds: 18, batchSize: 25, delayMs: 600 },
  { productCount: 1000, maxTimeSeconds: 25, batchSize: 30, delayMs: 500 }
];

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimit {
  requestsPerMinute: number;
  batchesPerMinute: number;
  productsPerMinute: number;
}

export const RATE_LIMITS: RateLimit = {
  requestsPerMinute: 100,
  batchesPerMinute: 10,
  productsPerMinute: 1000
};

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

export type RestaurantStatus = 'ouvert' | 'ferme';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type SyncStatus = 'success' | 'error' | 'retry';

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

export function validateProduct(product: Product): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validation nom_produit
  if (!product.nom_produit || product.nom_produit.length > 100) {
    errors.push('nom_produit: requis et max 100 caractères');
  }
  
  // Validation prix
  if (typeof product.prix !== 'number' || product.prix < 0 || product.prix > 1000000) {
    errors.push('prix: doit être un nombre entre 0 et 1000000');
  }
  
  // Validation description
  if (product.description && product.description.length > 200) {
    errors.push('description: max 200 caractères');
  }
  
  // Validation image
  if (product.image && product.image.length > 500) {
    errors.push('image: max 500 caractères');
  }
  
  // Validation note
  if (product.note !== undefined && (product.note < 0 || product.note > 5)) {
    errors.push('note: doit être entre 0 et 5');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateBatch(batch: ProductsBatchRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validation taille du lot
  if (batch.products.length > 30) {
    errors.push('Le lot contient trop de produits (max: 30)');
  }
  
  // Validation des produits
  batch.products.forEach((product, index) => {
    const validation = validateProduct(product);
    if (!validation.isValid) {
      errors.push(`Produit ${index}: ${validation.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export par défaut des utilitaires (pas des types)
export default {
  // Configuration
  BATCH_CONFIGS,
  getBatchConfig,
  PRODUCT_VALIDATION,
  PERFORMANCE_TARGETS,
  RATE_LIMITS,
  
  // Validation
  validateProduct,
  validateBatch
};
