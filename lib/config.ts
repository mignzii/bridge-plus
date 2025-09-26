/**
 * Configuration pour l'intégration Bridge+ - Mafalia
 */

export interface BridgeConfig {
  apiTokens: string[];
  requireAuth: boolean;
  baseUrl: string;
}

export interface MafaliaConfig {
  apiBaseUrl: string;
  apiToken: string;
  syncInterval: number; // en millisecondes
}

// Configuration par défaut
export const defaultBridgeConfig: BridgeConfig = {
  apiTokens: [
    'mafalia-api-token-2025',
    'test-token-123',
    // Ajoutez vos vrais tokens ici
  ],
  requireAuth: true,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

export const defaultMafaliaConfig: MafaliaConfig = {
  apiBaseUrl: process.env.MAFALIA_API_BASE_URL || 'https://mafalia.com/api',
  apiToken: process.env.MAFALIA_API_TOKEN || '',
  syncInterval: 5 * 60 * 1000, // 5 minutes par défaut
};

// Fonction pour obtenir la configuration depuis les variables d'environnement
export function getBridgeConfig(): BridgeConfig {
  const tokens = process.env.BRIDGE_API_TOKENS?.split(',') || defaultBridgeConfig.apiTokens;
  
  return {
    ...defaultBridgeConfig,
    apiTokens: tokens,
    requireAuth: process.env.BRIDGE_API_REQUIRE_AUTH !== 'false',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || defaultBridgeConfig.baseUrl,
  };
}

export function getMafaliaConfig(): MafaliaConfig {
  return {
    ...defaultMafaliaConfig,
    apiBaseUrl: process.env.MAFALIA_API_BASE_URL || defaultMafaliaConfig.apiBaseUrl,
    apiToken: process.env.MAFALIA_API_TOKEN || defaultMafaliaConfig.apiToken,
    syncInterval: parseInt(process.env.MAFALIA_SYNC_INTERVAL || '300000'),
  };
}
