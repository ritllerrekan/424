import { useState, useCallback } from 'react';
import {
  uploadJSON,
  uploadFile,
  retrieveContent,
  uploadCompleteBatch,
  uploadCompleteProfile,
  retrieveBatchWithAssets,
  retrieveProfileWithAssets,
  testAuthentication,
  generateGatewayUrl,
  BatchMetadata,
  UserProfileData,
  IPFSUploadResult,
} from '../lib/ipfs';

export function useIPFS() {
  const [isUploading, setIsUploading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadJsonData = useCallback(async (
    data: any,
    options?: { name?: string; keyvalues?: Record<string, string> }
  ): Promise<IPFSUploadResult | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadJSON(data, options);
      return result;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadFileData = useCallback(async (
    file: File,
    options?: { name?: string; keyvalues?: Record<string, string> }
  ): Promise<IPFSUploadResult | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadFile(file, options);
      return result;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadBatch = useCallback(async (
    metadata: BatchMetadata,
    images?: File[],
    documents?: File[]
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadCompleteBatch(metadata, images, documents);
      return result;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadProfile = useCallback(async (
    profile: UserProfileData,
    profileImage?: File,
    certifications?: File[]
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadCompleteProfile(profile, profileImage, certifications);
      return result;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const retrieveData = useCallback(async (cid: string) => {
    setIsRetrieving(true);
    setError(null);

    try {
      const data = await retrieveContent(cid);
      return data;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsRetrieving(false);
    }
  }, []);

  const retrieveBatch = useCallback(async (metadataCid: string) => {
    setIsRetrieving(true);
    setError(null);

    try {
      const batch = await retrieveBatchWithAssets(metadataCid);
      return batch;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsRetrieving(false);
    }
  }, []);

  const retrieveProfile = useCallback(async (profileCid: string) => {
    setIsRetrieving(true);
    setError(null);

    try {
      const profile = await retrieveProfileWithAssets(profileCid);
      return profile;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return null;
    } finally {
      setIsRetrieving(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const isAuthenticated = await testAuthentication();
      return isAuthenticated;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      return false;
    }
  }, []);

  const getGatewayUrl = useCallback((cid: string) => {
    return generateGatewayUrl(cid);
  }, []);

  return {
    isUploading,
    isRetrieving,
    error,
    uploadJsonData,
    uploadFileData,
    uploadBatch,
    uploadProfile,
    retrieveData,
    retrieveBatch,
    retrieveProfile,
    checkAuth,
    getGatewayUrl,
  };
}
