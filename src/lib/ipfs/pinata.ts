import PinataClient from '@pinata/sdk';
import { IPFS_CONFIG, validateConfig } from './config';
import { IPFSUploadResult, PinataResponse } from './types';
import { withRetry } from './retry';
import { ipfsCache } from './cache';

let pinataInstance: PinataClient | null = null;

export function getPinataClient(): PinataClient {
  if (!validateConfig()) {
    throw new Error('Pinata credentials not configured. Please set VITE_PINATA_API_KEY and VITE_PINATA_SECRET_KEY or VITE_PINATA_JWT in your .env file.');
  }

  if (!pinataInstance) {
    if (IPFS_CONFIG.pinataJwt) {
      pinataInstance = new PinataClient({ pinataJWTKey: IPFS_CONFIG.pinataJwt });
    } else {
      pinataInstance = new PinataClient(IPFS_CONFIG.pinataApiKey, IPFS_CONFIG.pinataSecretKey);
    }
  }

  return pinataInstance;
}

export async function testAuthentication(): Promise<boolean> {
  try {
    const pinata = getPinataClient();
    await pinata.testAuthentication();
    return true;
  } catch (error) {
    console.error('Pinata authentication failed:', error);
    return false;
  }
}

export async function uploadJSON(
  data: any,
  options?: { name?: string; keyvalues?: Record<string, string> }
): Promise<IPFSUploadResult> {
  return withRetry(async () => {
    const pinata = getPinataClient();

    const result: PinataResponse = await pinata.pinJSONToIPFS(data, {
      pinataMetadata: {
        name: options?.name || `json-${Date.now()}`,
        keyvalues: options?.keyvalues,
      },
    });

    const uploadResult: IPFSUploadResult = {
      cid: result.IpfsHash,
      size: result.PinSize,
      timestamp: result.Timestamp,
      gatewayUrl: `${IPFS_CONFIG.gatewayUrl}${result.IpfsHash}`,
    };

    ipfsCache.set(result.IpfsHash, data);

    return uploadResult;
  });
}

export async function uploadFile(
  file: File | Buffer,
  options?: { name?: string; keyvalues?: Record<string, string> }
): Promise<IPFSUploadResult> {
  return withRetry(async () => {
    const pinata = getPinataClient();

    let result: PinataResponse;

    if (file instanceof File) {
      const stream = file.stream();
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const blob = new Blob(chunks);
      const buffer = Buffer.from(await blob.arrayBuffer());

      result = await pinata.pinFileToIPFS(buffer, {
        pinataMetadata: {
          name: options?.name || file.name || `file-${Date.now()}`,
          keyvalues: options?.keyvalues,
        },
      });
    } else {
      result = await pinata.pinFileToIPFS(file, {
        pinataMetadata: {
          name: options?.name || `file-${Date.now()}`,
          keyvalues: options?.keyvalues,
        },
      });
    }

    return {
      cid: result.IpfsHash,
      size: result.PinSize,
      timestamp: result.Timestamp,
      gatewayUrl: `${IPFS_CONFIG.gatewayUrl}${result.IpfsHash}`,
    };
  });
}

export async function retrieveContent(cid: string): Promise<any> {
  const cached = ipfsCache.get(cid);
  if (cached) {
    return cached;
  }

  return withRetry(async () => {
    const url = `${IPFS_CONFIG.gatewayUrl}${cid}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text')) {
      data = await response.text();
    } else {
      data = await response.blob();
    }

    if (typeof data === 'object' && !(data instanceof Blob)) {
      ipfsCache.set(cid, data);
    }

    return data;
  });
}

export async function unpinContent(cid: string): Promise<void> {
  return withRetry(async () => {
    const pinata = getPinataClient();
    await pinata.unpin(cid);
    ipfsCache.delete(cid);
  });
}

export function generateGatewayUrl(cid: string): string {
  return `${IPFS_CONFIG.gatewayUrl}${cid}`;
}
