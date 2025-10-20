import { IPFS_CONFIG } from './config';

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = IPFS_CONFIG.maxRetries,
  delayMs: number = IPFS_CONFIG.retryDelay
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Operation failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}
