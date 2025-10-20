import { uploadJSON, uploadFile, retrieveContent } from './pinata';
import { BatchMetadata, IPFSUploadResult } from './types';

export async function uploadBatchMetadata(
  metadata: { type: string; data: any } | BatchMetadata
): Promise<string> {
  try {
    const timestamp = Date.now().toString();
    const batchId = 'batchId' in metadata ? metadata.batchId : 'unknown';
    const type = 'type' in metadata ? metadata.type : metadata.role;

    const result = await uploadJSON(metadata, {
      name: `batch-${batchId}-${type}`,
      keyvalues: {
        type: 'batch-metadata',
        batchId: batchId.toString(),
        role: type,
        timestamp,
      },
    });

    return result.cid;
  } catch (error) {
    console.error('Failed to upload batch metadata:', error);
    throw new Error(`Failed to upload batch metadata: ${(error as Error).message}`);
  }
}

export async function uploadBatchImages(
  batchId: string,
  images: File[]
): Promise<IPFSUploadResult[]> {
  const uploadPromises = images.map(async (image, index) => {
    try {
      return await uploadFile(image, {
        name: `batch-${batchId}-image-${index}-${image.name}`,
        keyvalues: {
          type: 'batch-image',
          batchId,
          index: index.toString(),
        },
      });
    } catch (error) {
      console.error(`Failed to upload image ${index}:`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
}

export async function uploadBatchDocuments(
  batchId: string,
  documents: File[]
): Promise<IPFSUploadResult[]> {
  const uploadPromises = documents.map(async (doc, index) => {
    try {
      return await uploadFile(doc, {
        name: `batch-${batchId}-doc-${index}-${doc.name}`,
        keyvalues: {
          type: 'batch-document',
          batchId,
          index: index.toString(),
        },
      });
    } catch (error) {
      console.error(`Failed to upload document ${index}:`, error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
}

export async function uploadCompleteBatch(
  metadata: BatchMetadata,
  images?: File[],
  documents?: File[]
): Promise<{
  metadata: string;
  images: IPFSUploadResult[];
  documents: IPFSUploadResult[];
}> {
  try {
    const imageResults = images && images.length > 0
      ? await uploadBatchImages(metadata.batchId, images)
      : [];

    const documentResults = documents && documents.length > 0
      ? await uploadBatchDocuments(metadata.batchId, documents)
      : [];

    const enrichedMetadata: BatchMetadata = {
      ...metadata,
      images: imageResults.map(r => r.cid),
      documents: documentResults.map(r => r.cid),
    };

    const metadataResult = await uploadBatchMetadata(enrichedMetadata);

    return {
      metadata: metadataResult,
      images: imageResults,
      documents: documentResults,
    };
  } catch (error) {
    console.error('Failed to upload complete batch:', error);
    throw new Error(`Failed to upload complete batch: ${(error as Error).message}`);
  }
}

export async function retrieveBatchMetadata(cid: string): Promise<BatchMetadata> {
  try {
    const metadata = await retrieveContent(cid);
    return metadata as BatchMetadata;
  } catch (error) {
    console.error('Failed to retrieve batch metadata:', error);
    throw new Error(`Failed to retrieve batch metadata: ${(error as Error).message}`);
  }
}

export async function retrieveBatchWithAssets(
  metadataCid: string
): Promise<{
  metadata: BatchMetadata;
  imageUrls: string[];
  documentUrls: string[];
}> {
  try {
    const metadata = await retrieveBatchMetadata(metadataCid);

    const imageUrls = metadata.images?.map(cid =>
      `${import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'}${cid}`
    ) || [];

    const documentUrls = metadata.documents?.map(cid =>
      `${import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/'}${cid}`
    ) || [];

    return {
      metadata,
      imageUrls,
      documentUrls,
    };
  } catch (error) {
    console.error('Failed to retrieve batch with assets:', error);
    throw new Error(`Failed to retrieve batch with assets: ${(error as Error).message}`);
  }
}
