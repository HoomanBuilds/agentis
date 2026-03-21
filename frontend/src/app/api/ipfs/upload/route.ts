import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ipfs/upload
 * 
 * Uploads JSON metadata to IPFS via Pinata using JWT authentication.
 * 
 * Required env vars:
 * - NEXT_PUBLIC_PINATA_JWT (JWT token for Bearer auth)
 * - NEXT_PUBLIC_PINATA_GATEWAY (gateway URL for viewing)
 * 
 * Request body:
 * {
 *   metadata: { name, description, traits, ... }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   ipfsHash: "QmXxx...",
 *   ipfsUrl: "ipfs://QmXxx...",
 *   gatewayUrl: "https://gateway.pinata.cloud/ipfs/QmXxx..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { metadata } = await request.json();

    if (!metadata) {
      return NextResponse.json(
        { error: 'Missing metadata' },
        { status: 400 }
      );
    }

    const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
    const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

    if (!PINATA_JWT) {
      console.error('Missing Pinata JWT. Please set NEXT_PUBLIC_PINATA_JWT in .env.local');
      return NextResponse.json(
        { error: 'IPFS service not configured' },
        { status: 500 }
      );
    }

    console.log('=== IPFS UPLOAD ===');
    console.log('Uploading metadata to Pinata:', JSON.stringify(metadata).substring(0, 200));
    console.log('Gateway:', PINATA_GATEWAY);

    // Use Pinata API to pin JSON with JWT Bearer auth
    const pinataUrl = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    
    const response = await fetch(pinataUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: metadata.name || 'Agent NFT Metadata',
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Pinata API error:', error);
      return NextResponse.json(
        { error: 'Failed to upload to IPFS' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const ipfsHash = result.IpfsHash;
    
    console.log('Successfully uploaded to IPFS:', ipfsHash);
    console.log('Gateway URL:', `${PINATA_GATEWAY}/ipfs/${ipfsHash}`);

    return NextResponse.json({
      success: true,
      ipfsHash,
      ipfsUrl: `ipfs://${ipfsHash}`,
      gatewayUrl: `${PINATA_GATEWAY}/ipfs/${ipfsHash}`,
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}
