/**
 * Middleware d'authentification pour les APIs Bridge+
 */

import { getBridgeConfig } from './config';

export interface AuthConfig {
  validTokens: string[];
  requireAuth: boolean;
}

export function validateAuthToken(token: string, config?: AuthConfig): boolean {
  const bridgeConfig = getBridgeConfig();
  const authConfig = config || {
    validTokens: bridgeConfig.apiTokens,
    requireAuth: bridgeConfig.requireAuth
  };
  
  if (!authConfig.requireAuth) {
    return true;
  }

  if (!token) {
    return false;
  }

  // Supprimer "Bearer " du début si présent
  const cleanToken = token.replace(/^Bearer\s+/i, '');
  
  return authConfig.validTokens.includes(cleanToken);
}

export function extractAuthToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Supprimer "Bearer " du début si présent
  return authHeader.replace(/^Bearer\s+/i, '');
}

export function createAuthError() {
  return {
    success: false,
    message: 'Authentification requise',
    error: 'Token manquant ou invalide'
  };
}

// Fonction utilitaire pour vérifier l'authentification dans les API routes
export function checkAuth(request: Request, config?: AuthConfig): { isValid: boolean; error?: any } {
  const authHeader = request.headers.get('authorization');
  const token = extractAuthToken(authHeader);
  
  if (!validateAuthToken(token || '', config)) {
    return {
      isValid: false,
      error: createAuthError()
    };
  }
  
  return { isValid: true };
}
