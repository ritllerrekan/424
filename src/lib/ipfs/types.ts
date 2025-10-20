export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  timestamp: string;
  gatewayUrl: string;
}

export interface BatchMetadata {
  batchId: string;
  role: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  data: Record<string, any>;
  images?: string[];
  documents?: string[];
}

export interface UserProfileData {
  userId: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  certifications?: string[];
  profileImage?: string;
}

export interface IPFSCacheEntry {
  cid: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}
