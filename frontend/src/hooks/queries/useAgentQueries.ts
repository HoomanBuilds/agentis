import { useQuery, useQueries } from '@tanstack/react-query';
import { CONTRACTS } from '@/constants/contracts';
import { AgentMetadata } from '@/hooks/useAgentNFT';

// Types
export interface AgentIPFSData {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  [key: string]: any;
}

export interface AgentFullData extends AgentMetadata {
  id: bigint;
  ipfsData?: AgentIPFSData;
  imageUrl?: string;
}

// Fetchers
export const fetchAgentMetadata = async (tokenId: bigint): Promise<AgentMetadata | null> => {
  const response = await fetch('/api/contract/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract: 'AgentNFT',
      entryPoint: 'get_agent_metadata',
      args: { token_id: tokenId.toString() }
    })
  });
  
  const data = await response.json();
  if (data.success && data.result) {
    // ABI returns anonymous tuple: (name, token_uri, personality_hash, created_at, creator, chat_count, level, is_public)
    const r = Array.isArray(data.result) ? data.result : Object.values(data.result);
    return {
      name: String(r[0] ?? ''),
      token_uri: String(r[1] ?? ''),
      personality_hash: String(r[2] ?? ''),
      created_at: BigInt(String(r[3] ?? 0)),
      creator: String(r[4] ?? ''),
      chat_count: BigInt(String(r[5] ?? 0)),
      level: BigInt(String(r[6] ?? 0)),
    };
  }
  return null;
};

export const fetchIPFSData = async (cid: string): Promise<AgentIPFSData | null> => {
  if (!cid) return null;
  
  try {
    const response = await fetch(`/api/ipfs/fetch?cid=${cid}`);
    if (!response.ok) throw new Error('Failed to fetch IPFS data');
    return await response.json();
  } catch (err) {
    console.error(`Error fetching IPFS data for CID ${cid}:`, err);
    return null;
  }
};

const fetchAgentsByOwner = async (ownerKey: string): Promise<bigint[]> => {
  if (!ownerKey) return [];
  // AgentNFT has no tokens_of_owner enumeration — iterate and filter by owner_of
  const statsRes = await fetch('/api/stats');
  const statsData = await statsRes.json();
  const totalSupply = Number(statsData.totalAgents || 0);
  if (totalSupply === 0) return [];

  const results = await Promise.all(
    Array.from({ length: totalSupply }, (_, i) => i + 1).map(async (id) => {
      const res = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: 'AgentNFT', entryPoint: 'owner_of', args: { token_id: String(id) } }),
      });
      const d = await res.json();
      if (d.success && d.result && String(d.result).toLowerCase() === ownerKey.toLowerCase()) {
        return BigInt(id);
      }
      return null;
    })
  );
  return results.filter((id): id is bigint => id !== null);
};

const fetchTotalSupply = async (): Promise<bigint> => {
  const response = await fetch('/api/stats');
  const data = await response.json();
  if (data.success && data.totalAgents) {
    return BigInt(data.totalAgents);
  }
  return BigInt(0);
};

// Hooks

export function useAgentMetadata(tokenId: bigint | undefined) {
  return useQuery({
    queryKey: ['agent', 'metadata', tokenId?.toString()],
    queryFn: () => fetchAgentMetadata(tokenId!),
    enabled: !!tokenId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAgentIPFSData(tokenUri: string | undefined) {
  const cid = tokenUri?.replace('ipfs://', '');
  
  return useQuery({
    queryKey: ['ipfs', cid],
    queryFn: async () => {
      const data = await fetchIPFSData(cid!);
      
      let imageUrl = undefined;
      if (data?.image) {
        let gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
        if (!gateway.endsWith('/ipfs/')) {
          gateway = gateway.replace(/\/$/, '') + '/ipfs/';
        }
        imageUrl = data.image.replace('ipfs://', gateway);
      }
      
      return { ...data, imageUrl };
    },
    enabled: !!cid,
    staleTime: Infinity, 
  });
}

export function useAgentFullData(tokenId: bigint | undefined) {
  const metadataQuery = useAgentMetadata(tokenId);
  const ipfsQuery = useAgentIPFSData(metadataQuery.data?.token_uri);
  
  return {
    ...metadataQuery,
    data: metadataQuery.data ? {
      ...metadataQuery.data,
      id: tokenId!,
      ipfsData: ipfsQuery.data,
      imageUrl: ipfsQuery.data?.imageUrl,
    } as AgentFullData : undefined,
    isLoading: metadataQuery.isLoading || (metadataQuery.data && ipfsQuery.isLoading),
    isError: metadataQuery.isError || ipfsQuery.isError,
  };
}

export function useOwnedAgents(ownerKey: string | undefined) {
  return useQuery({
    queryKey: ['agents', 'owned', ownerKey],
    queryFn: () => fetchAgentsByOwner(ownerKey!),
    enabled: !!ownerKey,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useAgentsMetadata(tokenIds: bigint[] | undefined) {
  const queries = useQueries({
    queries: (tokenIds || []).map(id => ({
      queryKey: ['agent', 'metadata', id.toString()],
      queryFn: () => fetchAgentMetadata(id),
      staleTime: 10 * 60 * 1000,
      enabled: !!id,
    }))
  });

  const agents = queries
    .map((q, index) => {
      if (!q.data) return null;
      return {
        ...q.data,
        id: tokenIds![index],
      };
    })
    .filter((a): a is (AgentMetadata & { id: bigint }) => a !== null);

  return {
    data: agents,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
  };
}

export function useAgentsIPFSData(agents: (AgentMetadata & { id: bigint })[] | undefined) {
  const queries = useQueries({
    queries: (agents || []).map(agent => {
      const cid = agent.token_uri?.replace('ipfs://', '');
      return {
        queryKey: ['ipfs', cid],
        queryFn: async () => {
          const data = await fetchIPFSData(cid!);
          
          let imageUrl = undefined;
          if (data?.image) {
            let gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
            if (!gateway.endsWith('/ipfs/')) {
              gateway = gateway.replace(/\/$/, '') + '/ipfs/';
            }
            imageUrl = data.image.replace('ipfs://', gateway);
          }
          
          return { ...data, imageUrl };
        },
        enabled: !!cid,
        staleTime: Infinity,
      };
    })
  });

  // Merge IPFS data with agent metadata
  return (agents || []).map((agent, index) => {
    const ipfsQuery = queries[index];
    const ipfsData = ipfsQuery?.data;
    
    return {
      ...agent,
      ipfsData,
      imageUrl: ipfsData?.imageUrl,
      isLoading: ipfsQuery?.isLoading,
    };
  });
}

export function useRecentAgents(limit: number = 10) {
  const { data: totalSupply } = useQuery({
    queryKey: ['stats', 'totalSupply'],
    queryFn: fetchTotalSupply,
  });

  const recentTokenIds: bigint[] = [];
  if (totalSupply && totalSupply > 0) {
    for (let i = 0; i < limit && i < Number(totalSupply); i++) {
      recentTokenIds.push(totalSupply - BigInt(i));
    }
  }

  return useAgentsMetadata(recentTokenIds);
}

export function useAllAgents() {
  const { data: totalSupply } = useQuery({
    queryKey: ['stats', 'totalSupply'],
    queryFn: fetchTotalSupply,
  });

  const allTokenIds: bigint[] = [];
  if (totalSupply && totalSupply > 0) {
    for (let i = Number(totalSupply); i >= 1; i--) {
      allTokenIds.push(BigInt(i));
    }
  }

  return useAgentsMetadata(allTokenIds);
}

export function useAgentVisibility(tokenId: bigint | undefined) {
  return useQuery({
    queryKey: ['agent', 'visibility', tokenId?.toString()],
    queryFn: async (): Promise<boolean> => {
      if (!tokenId) return true;
      try {
        const response = await fetch('/api/contract/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contract: 'AgentNFT',
            entryPoint: 'get_agent_public',
            args: { token_id: tokenId.toString() },
          }),
        });
        const data = await response.json();
        if (data.success && typeof data.result === 'boolean') {
          return data.result;
        }
        return true;
      } catch (err) {
        console.error('Error fetching visibility:', err);
        return true;
      }
    },
    enabled: !!tokenId,
    staleTime: 5 * 60 * 1000,
  });
}
