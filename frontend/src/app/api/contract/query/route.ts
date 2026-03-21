import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';

const VALID_CONTRACTS = ['AgentNFT', 'AgentCredits', 'RevenueShare', 'AgentMarketplace'] as const;
type ContractName = (typeof VALID_CONTRACTS)[number];

export async function POST(request: NextRequest) {
  try {
    const { contract: contractName, entryPoint, args } = await request.json();

    if (!contractName || !VALID_CONTRACTS.includes(contractName as ContractName)) {
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

    const argsArray = Array.isArray(args) ? args : args ? Object.values(args) : [];

    const contract = getContract(contractName as ContractName);
    const result = await contract.call(entryPoint, argsArray);

    const serialized = JSON.parse(
      JSON.stringify(result, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return NextResponse.json({ success: true, result: serialized });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Contract query error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
