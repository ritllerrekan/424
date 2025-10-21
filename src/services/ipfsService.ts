const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export interface IPFSMetadata {
  batchId?: string;
  batchNumber?: string;
  phase?: string;
  additionalData?: Record<string, any>;
  images?: string[];
  documents?: string[];
  certificates?: string[];
  [key: string]: any;
}

export async function fetchIPFSMetadata(ipfsHash: string): Promise<IPFSMetadata | null> {
  if (!ipfsHash) {
    return null;
  }

  try {
    const url = `${IPFS_GATEWAY}${ipfsHash}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('IPFS fetch failed:', response.statusText);
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return data as IPFSMetadata;
    } else {
      console.warn('IPFS content is not JSON:', contentType);
      return null;
    }
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

export async function fetchIPFSImage(ipfsHash: string): Promise<string | null> {
  if (!ipfsHash) {
    return null;
  }

  try {
    const url = `${IPFS_GATEWAY}${ipfsHash}`;
    return url;
  } catch (error) {
    console.error('Error generating IPFS image URL:', error);
    return null;
  }
}

export async function fetchMultipleIPFSMetadata(ipfsHashes: string[]): Promise<IPFSMetadata[]> {
  const promises = ipfsHashes.map(hash => fetchIPFSMetadata(hash));
  const results = await Promise.all(promises);
  return results.filter(result => result !== null) as IPFSMetadata[];
}

export function getIPFSUrl(ipfsHash: string): string {
  return `${IPFS_GATEWAY}${ipfsHash}`;
}

export function isValidIPFSHash(hash: string): boolean {
  if (!hash) return false;

  const ipfsHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^bafybei[a-z2-7]{52}$/;
  return ipfsHashRegex.test(hash);
}

export async function checkIPFSAvailability(ipfsHash: string): Promise<boolean> {
  if (!ipfsHash || !isValidIPFSHash(ipfsHash)) {
    return false;
  }

  try {
    const url = `${IPFS_GATEWAY}${ipfsHash}`;
    const response = await fetch(url, {
      method: 'HEAD'
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking IPFS availability:', error);
    return false;
  }
}
