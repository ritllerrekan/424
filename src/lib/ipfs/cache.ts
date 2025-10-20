import { IPFSCacheEntry } from './types';
import { IPFS_CONFIG } from './config';

class IPFSCache {
  private cache: Map<string, IPFSCacheEntry> = new Map();

  set(cid: string, data: any, ttl: number = IPFS_CONFIG.cacheTimeout): void {
    const now = Date.now();
    const entry: IPFSCacheEntry = {
      cid,
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };
    this.cache.set(cid, entry);
    this.cleanExpired();
  }

  get(cid: string): any | null {
    const entry = this.cache.get(cid);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cid);
      return null;
    }

    return entry.data;
  }

  has(cid: string): boolean {
    const entry = this.cache.get(cid);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(cid);
      return false;
    }

    return true;
  }

  delete(cid: string): void {
    this.cache.delete(cid);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [cid, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(cid);
      }
    }
  }

  getStats() {
    this.cleanExpired();
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export const ipfsCache = new IPFSCache();
