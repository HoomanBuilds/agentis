import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory cache for IPFS content.
 * Since IPFS content is immutable (same CID = same content).
 * This significantly improves chat performance by avoiding repeated fetches.
 */
const ipfsCache = new Map<string, { data: unknown; contentType: string }>();

let cacheHits = 0;
let cacheMisses = 0;

/**
 * GET /api/ipfs/fetch?cid=<cid>
 * 
 * Fetches content from IPFS via gateway (server-side to avoid CORS)
 * Uses fallback gateways if primary is rate limited.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cid = searchParams.get('cid');
    
    if (!cid) {
      return NextResponse.json(
        { error: 'Missing cid parameter' },
        { status: 400 }
      );
    }

    const cached = ipfsCache.get(cid);
    if (cached) {
      cacheHits++;
      console.log(`IPFS cache HIT for ${cid.substring(0, 20)}... (hits: ${cacheHits}, misses: ${cacheMisses})`);
      return NextResponse.json(cached.data);
    }
    
    cacheMisses++;
    console.log(`IPFS cache MISS for ${cid.substring(0, 20)}... (hits: ${cacheHits}, misses: ${cacheMisses})`);

    // List of gateways to try (in order of reliability)
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://dweb.link/ipfs/',
      'https://w3s.link/ipfs/',
    ];

    for (const gateway of gateways) {
      const gatewayUrl = gateway + cid;
      console.log('Trying IPFS gateway:', gatewayUrl);

      try {
        const response = await fetch(gatewayUrl, {
          headers: {
            'Accept': 'application/json, */*',
          },
        });

        if (response.status === 429) {
          console.log('Rate limited by:', gateway);
          continue; 
        }

        if (!response.ok) {
          console.log('Gateway error:', response.status, gateway);
          continue;
        }

        const contentType = response.headers.get('content-type') || '';

        // If JSON, parse and return
        if (contentType.includes('application/json') || contentType.includes('text/plain')) {
          const data = await response.json();
          console.log('Successfully fetched from:', gateway);
          
          ipfsCache.set(cid, { data, contentType: 'application/json' });
          
          return NextResponse.json(data);
        }

        // If image/binary, return as base64
        if (contentType.includes('image')) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const data = {
            contentType,
            data: `data:${contentType};base64,${base64}`
          };
          
          // Cache the result
          ipfsCache.set(cid, { data, contentType });
          
          return NextResponse.json(data);
        }

        // Default: try to parse as JSON
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          console.log('Successfully fetched from:', gateway);
          
          ipfsCache.set(cid, { data, contentType: 'application/json' });
          
          return NextResponse.json(data);
        } catch {
          const data = { text };
          ipfsCache.set(cid, { data, contentType: 'text/plain' });
          return NextResponse.json(data);
        }

      } catch (err) {
        console.log('Gateway fetch error:', gateway, err);
        continue; // Try next gateway
      }
    }

    // All gateways failed
    return NextResponse.json(
      { error: 'All IPFS gateways failed' },
      { status: 502 }
    );

  } catch (error) {
    console.error('IPFS fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from IPFS' },
      { status: 500 }
    );
  }
}
