/**
 * Utilitaires de validation pour l'intégration Bridge+ ↔ Mafalia
 * Version 1.0 - 27 Janvier 2025
 */

import { 
  Restaurant, 
  Category, 
  Product, 
  RestaurantSyncRequest, 
  ProductsBatchRequest,
  BridgePlusErrorCode,
  PRODUCT_VALIDATION 
} from '@/types/bridge-mafalia-contract';

// ============================================================================
// VALIDATION DES RESTAURANTS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateRestaurant(restaurant: Restaurant): ValidationResult {
  const errors: string[] = [];

  // Validation ID
  if (!restaurant.id || typeof restaurant.id !== 'string') {
    errors.push('ID du restaurant requis et doit être une chaîne');
  }

  // Validation nom_restaurant
  if (!restaurant.nom_restaurant || typeof restaurant.nom_restaurant !== 'string') {
    errors.push('Nom du restaurant requis et doit être une chaîne');
  } else if (restaurant.nom_restaurant.length > 100) {
    errors.push('Nom du restaurant ne peut pas dépasser 100 caractères');
  }

  // Validation statut
  if (restaurant.statut && !['ouvert', 'ferme'].includes(restaurant.statut)) {
    errors.push('Statut doit être "ouvert" ou "ferme"');
  }

  // Validation image
  if (restaurant.image) {
    if (typeof restaurant.image !== 'string') {
      errors.push('Image doit être une chaîne');
    } else if (restaurant.image.length > 500) {
      errors.push('URL de l\'image ne peut pas dépasser 500 caractères');
    } else if (!isValidUrl(restaurant.image)) {
      errors.push('URL de l\'image invalide');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// VALIDATION DES CATÉGORIES
// ============================================================================

export function validateCategory(category: Category): ValidationResult {
  const errors: string[] = [];

  // Validation ID
  if (!category.id || typeof category.id !== 'string') {
    errors.push('ID de la catégorie requis et doit être une chaîne');
  }

  // Validation nom_categorie
  if (!category.nom_categorie || typeof category.nom_categorie !== 'string') {
    errors.push('Nom de la catégorie requis et doit être une chaîne');
  } else if (category.nom_categorie.length > 50) {
    errors.push('Nom de la catégorie ne peut pas dépasser 50 caractères');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// VALIDATION DES PRODUITS
// ============================================================================

export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];

  // Validation ID
  if (!product.id || typeof product.id !== 'string') {
    errors.push('ID du produit requis et doit être une chaîne');
  }

  // Validation nom_produit
  if (!product.nom_produit || typeof product.nom_produit !== 'string') {
    errors.push('Nom du produit requis et doit être une chaîne');
  } else {
    if (product.nom_produit.length > 100) {
      errors.push('Nom du produit ne peut pas dépasser 100 caractères');
    }
    if (PRODUCT_VALIDATION.nom_produit.pattern && !PRODUCT_VALIDATION.nom_produit.pattern.test(product.nom_produit)) {
      errors.push('Nom du produit contient des caractères non autorisés');
    }
  }


  // Validation description
  if (product.description) {
    if (typeof product.description !== 'string') {
      errors.push('Description doit être une chaîne');
    } else if (product.description.length > 200) {
      errors.push('Description ne peut pas dépasser 200 caractères');
    }
  }

  // Validation image
  if (product.image) {
    if (typeof product.image !== 'string') {
      errors.push('Image doit être une chaîne');
    } else if (product.image.length > 500) {
      errors.push('URL de l\'image ne peut pas dépasser 500 caractères');
    } else if (!isValidUrl(product.image)) {
      errors.push('URL de l\'image invalide');
    }
  }


  // Validation restaurant_id
  if (!product.restaurant_id || typeof product.restaurant_id !== 'string') {
    errors.push('ID du restaurant requis et doit être une chaîne');
  }

  // Validation categorie_id
  if (!product.categorie_id || typeof product.categorie_id !== 'string') {
    errors.push('ID de la catégorie requis et doit être une chaîne');
  }

  // Validation accompagnants
  if (product.accompagnants) {
    if (!Array.isArray(product.accompagnants)) {
      errors.push('Accompagnants doit être un tableau');
    } else {
      product.accompagnants.forEach((acc, index) => {
        if (typeof acc !== 'string') {
          errors.push(`Accompagnant ${index} doit être une chaîne`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// VALIDATION DES REQUÊTES
// ============================================================================

export function validateRestaurantSyncRequest(request: RestaurantSyncRequest): ValidationResult {
  const errors: string[] = [];

  // Validation restaurant
  if (!request.restaurant) {
    errors.push('Restaurant requis');
  } else {
    const restaurantValidation = validateRestaurant(request.restaurant);
    if (!restaurantValidation.isValid) {
      errors.push(...restaurantValidation.errors.map(err => `Restaurant: ${err}`));
    }
  }

  // Validation categories
  if (!Array.isArray(request.categories)) {
    errors.push('Categories doit être un tableau');
  } else {
    request.categories.forEach((category, index) => {
      const categoryValidation = validateCategory(category);
      if (!categoryValidation.isValid) {
        errors.push(...categoryValidation.errors.map(err => `Catégorie ${index}: ${err}`));
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateProductsBatchRequest(request: ProductsBatchRequest): ValidationResult {
  const errors: string[] = [];

  // Validation products
  if (!Array.isArray(request.products)) {
    errors.push('Products doit être un tableau');
  } else {
    if (request.products.length === 0) {
      errors.push('Le lot doit contenir au moins un produit');
    }
    if (request.products.length > 30) {
      errors.push('Le lot ne peut pas contenir plus de 30 produits');
    }

    request.products.forEach((product, index) => {
      const productValidation = validateProduct(product);
      if (!productValidation.isValid) {
        errors.push(...productValidation.errors.map(err => `Produit ${index}: ${err}`));
      }
    });
  }

  // Validation batchId
  if (!request.batchId || typeof request.batchId !== 'string') {
    errors.push('batchId requis et doit être une chaîne');
  }

  // Validation totalBatches
  if (typeof request.totalBatches !== 'number' || request.totalBatches < 1) {
    errors.push('totalBatches doit être un nombre positif');
  }

  // Validation currentBatch
  if (typeof request.currentBatch !== 'number' || request.currentBatch < 1) {
    errors.push('currentBatch doit être un nombre positif');
  }

  // Validation restaurantId
  if (!request.restaurantId || typeof request.restaurantId !== 'string') {
    errors.push('restaurantId requis et doit être une chaîne');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// ============================================================================
// VALIDATION AVEC CODES D'ERREUR
// ============================================================================

export interface ValidationError {
  code: BridgePlusErrorCode;
  message: string;
  details?: any;
}

export function validateWithErrorCode(
  request: RestaurantSyncRequest | ProductsBatchRequest,
  type: 'restaurant' | 'batch'
): { isValid: boolean; error?: ValidationError } {
  let validation: ValidationResult;

  if (type === 'restaurant') {
    validation = validateRestaurantSyncRequest(request as RestaurantSyncRequest);
  } else {
    validation = validateProductsBatchRequest(request as ProductsBatchRequest);
  }

  if (validation.isValid) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: {
      code: BridgePlusErrorCode.VALIDATION_ERROR,
      message: 'Données de requête invalides',
      details: validation.errors
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateRestaurant,
  validateCategory,
  validateProduct,
  validateRestaurantSyncRequest,
  validateProductsBatchRequest,
  validateWithErrorCode
};
