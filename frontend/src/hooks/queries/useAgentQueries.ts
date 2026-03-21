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
    const parsed = data.result;
    return {
      name: String(parsed.name || ''),
      token_uri: String(parsed.token_uri || ''),
      personality_hash: String(parsed.personality_hash || ''),
      created_at: BigInt(String(parsed.created_at || 0)),
      creator: String(parsed.creator || ''),
      chat_count: BigInt(String(parsed.chat_count || 0)),
      level: BigInt(String(parsed.level || 0)),
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
  
  const response = await fetch('/api/contract/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract: 'AgentNFT',
      entryPoint: 'tokens_of_owner',
      args: { owner: ownerKey }
    })
  });
  
  const data = await response.json();
  if (data.success && Array.isArray(data.result)) {
    return data.result.map((id: string | number) => BigInt(id));
  }
  return [];
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
