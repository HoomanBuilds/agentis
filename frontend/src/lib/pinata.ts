import axios from 'axios';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload JSON data to Pinata IPFS
 * @param data - The JSON data to upload
 * @param name - Name for the pinned content
 * @returns IPFS hash (CID)
 */
export async function uploadJSONToPinata(
  data: Record<string, unknown>,
  name: string
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT not configured');
  }

  try {
    const body = {
      pinataContent: data,
      pinataMetadata: {
        name: name,
      },
    };

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      body,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error);
    throw error;
  }
}

/**
 * Upload file to Pinata IPFS
 * @param file - File to upload
 * @returns IPFS hash (CID)
 */
export async function uploadFileToPinata(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        maxBodyLength: Infinity,
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    throw error;
  }
}

/**
 * Get HTTP URL from IPFS hash using configured gateway
 * @param hash - IPFS hash (CID)
 * @returns Full HTTP URL
 */
export function getIPFSUrl(hash: string): string {
  const gateway = PINATA_GATEWAY.endsWith('/') 
    ? PINATA_GATEWAY.slice(0, -1) 
    : PINATA_GATEWAY;
  return `${gateway}/ipfs/${hash}`;
}

/**
 * Get IPFS URI for on-chain storage
 * @param hash - IPFS hash (CID)
 * @returns IPFS protocol URI
 */
export function getIPFSUri(hash: string): string {
  return `ipfs://${hash}`;
}

/**
 * Resolve IPFS URI to HTTP URL
 * Handles: ipfs://, raw hashes, and existing HTTP URLs
 * @param uri - URI to resolve
 * @returns HTTP URL
 */
export function resolveIPFS(uri: string | undefined): string {
  if (!uri) return '';

  let gateway = PINATA_GATEWAY;
  if (gateway.endsWith('/')) {
    gateway = gateway.slice(0, -1);
  }
  if (!gateway.startsWith('http')) {
    gateway = `https://${gateway}`;
  }

  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', `${gateway}/ipfs/`);
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  if (uri.match(/^[a-zA-Z0-9]{46}$/) || uri.match(/^Qm[a-zA-Z0-9]{44}$/)) {
    return `${gateway}/ipfs/${uri}`;
  }

  return uri;
}

/**
 * Test Pinata connection
 * @returns true if connection successful
 */
export async function testPinataConnection(): Promise<boolean> {
  if (!PINATA_JWT) {
    console.error('PINATA_JWT not configured');
    return false;
  }

  try {
    const response = await axios.get(
      `${PINATA_API_URL}/data/testAuthentication`,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
}

/**
 * Upload agent metadata to IPFS
 * This creates the full NFT metadata structure
 */
export async function uploadAgentMetadata(
  name: string,
  description: string,
  imageHash: string | null,
  personality: Record<string, unknown>,
  attributes: Array<{ trait_type: string; value: string | number }>
): Promise<{ hash: string; uri: string }> {
  const metadata = {
    name,
    description,
    image: imageHash ? getIPFSUri(imageHash) : '',
    external_url: '',
    personality,
    attributes: [
      ...attributes,
      { trait_type: 'Created', value: new Date().toISOString() },
    ],
  };

  const hash = await uploadJSONToPinata(metadata, `agent-${name}-metadata`);
  
  return {
    hash,
    uri: getIPFSUri(hash),
  };
}
