import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ipfs/upload-image
 * 
 * Uploads an image file to IPFS via Pinata.
 * 
 * Required env vars:
 * - NEXT_PUBLIC_PINATA_JWT
 * - NEXT_PUBLIC_PINATA_GATEWAY
 * 
 * Request: FormData with 'file' field
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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
    const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

    if (!PINATA_JWT) {
      console.error('Missing Pinata JWT');
      return NextResponse.json(
        { error: 'IPFS service not configured' },
        { status: 500 }
      );
    }

    console.log('=== IPFS IMAGE UPLOAD ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', (file.size / 1024).toFixed(2), 'KB');

    // Create FormData for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);
    
    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: file.name || 'Agent NFT Image',
    });
    pinataFormData.append('pinataMetadata', pinataMetadata);
    
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append('pinataOptions', pinataOptions);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Pinata API error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image to IPFS' },
        { status: 500 }
      );
    }

    const result = await response.json();
    const ipfsHash = result.IpfsHash;
    
    console.log('Successfully uploaded image to IPFS:', ipfsHash);
    console.log('Gateway URL:', `${PINATA_GATEWAY}/ipfs/${ipfsHash}`);

    return NextResponse.json({
      success: true,
      ipfsHash,
      ipfsUrl: `ipfs://${ipfsHash}`,
      gatewayUrl: `${PINATA_GATEWAY}/ipfs/${ipfsHash}`,
    });

  } catch (error) {
    console.error('IPFS image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image to IPFS' },
      { status: 500 }
    );
  }
}
