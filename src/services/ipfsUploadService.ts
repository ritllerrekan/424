const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';

export interface IPFSUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToIPFS(data: any): Promise<string> {
  try {
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json' });

    const formData = new FormData();
    formData.append('file', blob, 'metadata.json');

    const metadata = JSON.stringify({
      name: `Batch-${Date.now()}-metadata.json`,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result: IPFSUploadResponse = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    const result: IPFSUploadResponse = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

export async function uploadMultipleFilesToIPFS(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadFileToIPFS(file));
  return Promise.all(uploadPromises);
}
