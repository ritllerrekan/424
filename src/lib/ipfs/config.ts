export const IPFS_CONFIG = {
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || '',
  pinataSecretKey: import.meta.env.VITE_PINATA_SECRET_KEY || '',
  pinataJwt: import.meta.env.VITE_PINATA_JWT || '',
  gatewayUrl: import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/',
  maxRetries: 3,
  retryDelay: 1000,
  cacheTimeout: 3600000,
};

export const validateConfig = (): boolean => {
  return !!(
    (IPFS_CONFIG.pinataApiKey && IPFS_CONFIG.pinataSecretKey) ||
    IPFS_CONFIG.pinataJwt
  );
};
