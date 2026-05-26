import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';
import { CONTRACTS } from '@/constants/contracts';

const VALID_CONTRACTS = ['AgentNFT', 'AgentCredits', 'RevenueShare', 'AgentMarketplace'] as const;
type ContractName = (typeof VALID_CONTRACTS)[number];

// Simple in-memory cache with 2 min TTL
const cache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: unknown) {
  cache.set(key, { result, timestamp: Date.now() });
  // Evict old entries periodically
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.timestamp > CACHE_TTL) cache.delete(k);
    }
  }
}

// Map legacy contractPackageHash addresses to contract names
function resolveContractName(body: {
  contract?: string;
  contractPackageHash?: string;
}): ContractName | null {
  if (body.contract && VALID_CONTRACTS.includes(body.contract as ContractName)) {
    return body.contract as ContractName;
  }

  if (body.contractPackageHash) {
    const hash = body.contractPackageHash.toLowerCase().replace(/^0x/, '');
    const addresses = CONTRACTS.addresses as Record<string, string>;
    for (const name of VALID_CONTRACTS) {
      const addr = addresses[name]?.toLowerCase().replace(/^0x/, '');
      if (addr && addr === hash) return name;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryPoint, args } = body;

    const contractName = resolveContractName(body);
    if (!contractName) {
      return NextResponse.json(
        { success: false, error: `Invalid contract. Must be one of: ${VALID_CONTRACTS.join(', ')}` },
        { status: 400 },
      );
    }

    if (!entryPoint || typeof entryPoint !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid entryPoint' },
        { status: 400 },
      );
    }

    // Build args array from object or use directly if already an array
    const argsArray = Array.isArray(args) ? args : args ? Object.values(args) : [];

    // Check cache
    const cacheKey = JSON.stringify({ contractName, entryPoint, argsArray });
    const cached = getCached(cacheKey);
    if (cached !== null) {
      return NextResponse.json({ success: true, result: cached });
    }

    const contract = getContract(contractName);
    const result = await contract.call(entryPoint, argsArray, { blockIdentifier: 'latest' });

    // Serialize BigInt values
    const serialized = JSON.parse(
      JSON.stringify(result, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    setCache(cacheKey, serialized);

    return NextResponse.json({ success: true, result: serialized });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // TOKEN_NOT_FOUND = token doesn't exist; return null result instead of 500
    if (message.includes('TOKEN_NOT_FOUND') || message.includes('token not found') || message.includes('ERC721: invalid token ID')) {
      return NextResponse.json({ success: true, result: null });
    }
    console.error('Contract call error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
