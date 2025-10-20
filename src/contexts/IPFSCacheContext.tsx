import React, { createContext, useContext, useState, useEffect } from 'react';

interface CachedIPFSContent {
  hash: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface IPFSCacheContextType {
  getFromCache: (hash: string) => any | null;
  setInCache: (hash: string, data: any, ttl?: number) => void;
  clearCache: () => void;
  removeFromCache: (hash: string) => void;
  getCacheSize: () => number;
  getCacheStats: () => { size: number; entries: number; oldestEntry: number | null };
}

const IPFS_CACHE_KEY = 'ipfs_cache';
const DEFAULT_TTL = 3600000;
const MAX_CACHE_SIZE = 50;

const IPFSCacheContext = createContext<IPFSCacheContextType | undefined>(undefined);

export const IPFSCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Map<string, CachedIPFSContent>>(() => {
    const stored = localStorage.getItem(IPFS_CACHE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const filtered = Object.entries(parsed).filter(
          ([_, value]: [string, any]) => value.expiresAt > now
        );
        return new Map(filtered.map(([key, value]) => [key, value as CachedIPFSContent]));
      } catch (error) {
        console.error('Failed to parse IPFS cache:', error);
      }
    }
    return new Map();
  });

  useEffect(() => {
    const cacheObj = Object.fromEntries(cache.entries());
    localStorage.setItem(IPFS_CACHE_KEY, JSON.stringify(cacheObj));
  }, [cache]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCache(prev => {
        const updated = new Map(prev);
        for (const [hash, content] of updated.entries()) {
          if (content.expiresAt <= now) {
            updated.delete(hash);
          }
        }
        return updated;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getFromCache = (hash: string): any | null => {
    const cached = cache.get(hash);
    if (!cached) return null;

    const now = Date.now();
    if (cached.expiresAt <= now) {
      removeFromCache(hash);
      return null;
    }

    return cached.data;
  };

  const setInCache = (hash: string, data: any, ttl: number = DEFAULT_TTL) => {
    const now = Date.now();
    setCache(prev => {
      const updated = new Map(prev);

      if (updated.size >= MAX_CACHE_SIZE && !updated.has(hash)) {
        const oldestEntry = Array.from(updated.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldestEntry) {
          updated.delete(oldestEntry[0]);
        }
      }

      updated.set(hash, {
        hash,
        data,
        timestamp: now,
        expiresAt: now + ttl,
      });

      return updated;
    });
  };

  const clearCache = () => {
    setCache(new Map());
  };

  const removeFromCache = (hash: string) => {
    setCache(prev => {
      const updated = new Map(prev);
      updated.delete(hash);
      return updated;
    });
  };

  const getCacheSize = () => cache.size;

  const getCacheStats = () => {
    const entries = cache.size;
    const oldest = Array.from(cache.values())
      .sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp || null;

    return {
      size: entries,
      entries,
      oldestEntry: oldest,
    };
  };

  return (
    <IPFSCacheContext.Provider
      value={{
        getFromCache,
        setInCache,
        clearCache,
        removeFromCache,
        getCacheSize,
        getCacheStats,
      }}
    >
      {children}
    </IPFSCacheContext.Provider>
  );
};

export const useIPFSCache = () => {
  const context = useContext(IPFSCacheContext);
  if (!context) {
    throw new Error('useIPFSCache must be used within IPFSCacheProvider');
  }
  return context;
};
