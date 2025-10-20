export class BlockchainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export function handleBlockchainError(error: any): BlockchainError {
  if (error instanceof BlockchainError) {
    return error;
  }

  const errorString = error?.message || String(error);

  if (errorString.includes('network')) {
    return new BlockchainError(
      'Network connection failed. Please check your internet connection.',
      ErrorCode.NETWORK_ERROR,
      error
    );
  }

  if (errorString.includes('provider') || errorString.includes('RPC')) {
    return new BlockchainError(
      'Provider error. The blockchain network may be unavailable.',
      ErrorCode.PROVIDER_ERROR,
      error
    );
  }

  if (errorString.includes('contract')) {
    return new BlockchainError(
      'Contract interaction failed. Please try again.',
      ErrorCode.CONTRACT_ERROR,
      error
    );
  }

  if (errorString.includes('transaction')) {
    return new BlockchainError(
      'Transaction failed. Please check your inputs and try again.',
      ErrorCode.TRANSACTION_ERROR,
      error
    );
  }

  if (errorString.includes('timeout')) {
    return new BlockchainError(
      'Request timed out. Please try again.',
      ErrorCode.TIMEOUT_ERROR,
      error
    );
  }

  if (errorString.includes('rate limit') || errorString.includes('429')) {
    return new BlockchainError(
      'Rate limit exceeded. Please wait and try again.',
      ErrorCode.RATE_LIMIT_ERROR,
      error
    );
  }

  return new BlockchainError(
    'An unexpected error occurred. Please try again.',
    ErrorCode.UNKNOWN_ERROR,
    error
  );
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const blockchainError = handleBlockchainError(error);

      if (
        blockchainError.code === ErrorCode.RATE_LIMIT_ERROR ||
        blockchainError.code === ErrorCode.NETWORK_ERROR ||
        blockchainError.code === ErrorCode.TIMEOUT_ERROR
      ) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      throw blockchainError;
    }
  }

  throw handleBlockchainError(lastError);
}

export function isRecoverableError(error: BlockchainError): boolean {
  return [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.RATE_LIMIT_ERROR,
  ].includes(error.code as ErrorCode);
}
