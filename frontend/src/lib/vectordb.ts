import { ChromaClient } from "chromadb";

type Collection = any;

/**
 * ChromaDB client singleton
 * IMPORTANT: Server-side only (API routes, Server Actions, Server Components)
 */
let chromaClient: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    const chromaUrl = process.env.CHROMA_URL;
    const chromaApiKey = process.env.CHROMA_API_KEY;
    const chromaTenant = process.env.CHROMA_TENANT;
    const chromaDatabase = process.env.CHROMA_DATABASE;

    if (chromaApiKey && chromaTenant && chromaDatabase) {
      const { CloudClient } = require("chromadb");
      chromaClient = new CloudClient({
        apiKey: chromaApiKey,
        tenant: chromaTenant,
        database: chromaDatabase,
      });
    } else if (chromaUrl) {
      chromaClient = new ChromaClient({ path: chromaUrl });
    } else {
      chromaClient = new ChromaClient({ path: "http://localhost:8000" });
    }
  }
  if (!chromaClient) {
    throw new Error("Failed to initialize ChromaDB client");
  }
  return chromaClient;
}

/**
 * Get or create a collection for agent memories.
 * No embeddingFunction — ChromaDB Cloud handles embedding server-side.
 */
export async function getAgentMemoryCollection(): Promise<Collection> {
  const client = getChromaClient();
  return await client.getOrCreateCollection({
    name: "agent_memories_v5",
    metadata: { description: "Chat memories for AI agents" },
  });
}

/**
 * Store a chat message in vector DB with session support.
 * Pass documents only — ChromaDB generates embeddings server-side.
 */
export async function storeMessage(
  agentId: number,
  userAddress: string,
  role: "user" | "assistant",
  content: string,
  timestamp: number = Date.now(),
  sessionId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const collection = await getAgentMemoryCollection();
    const id = `${agentId}_${userAddress}_${timestamp}_${role}`;
    const session = sessionId || "default";

    await collection.add({
      ids: [id],
      documents: [content],
      metadatas: [
        {
          agentId: agentId.toString(),
          userAddress,
          role,
          timestamp: timestamp.toString(),
          sessionId: session,
        },
      ],
    });

    return { success: true, id };
  } catch (error: any) {
    console.error("Error storing message:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Search for relevant memories using semantic search (within a session).
 * Uses queryTexts — ChromaDB embeds the query server-side.
 */
export async function searchMemories(
  agentId: number,
  userAddress: string,
  query: string,
  limit: number = 5,
  sessionId?: string
): Promise<
  Array<{
    content: string;
    role: string;
    timestamp: number;
    distance: number;
  }>
> {
  try {
    const collection = await getAgentMemoryCollection();

    const whereClause: any = {
      $and: [{ agentId: agentId.toString() }, { userAddress: userAddress }],
    };

    if (sessionId) {
      whereClause.$and.push({ sessionId });
    }

    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where: whereClause,
    });

    if (
      !results.documents?.[0] ||
      !results.metadatas?.[0] ||
      !results.distances?.[0]
    ) {
      return [];
    }

    return results.documents[0].map((doc: any, idx: number) => ({
      content: doc || "",
      role: (results.metadatas?.[0]?.[idx]?.role as string) || "",
      timestamp: parseInt(
        (results.metadatas?.[0]?.[idx]?.timestamp as string) || "0"
      ),
      distance: results.distances?.[0]?.[idx] || 0,
    }));
  } catch (error) {
    console.error("Error searching memories:", error);
    return [];
  }
}

/**
 * Get recent messages (chronological, not semantic) for a specific session
 */
export async function getRecentMessages(
  agentId: number,
  userAddress: string,
  limit: number = 10,
  sessionId?: string
): Promise<
  Array<{
    content: string;
    role: string;
    timestamp: number;
  }>
> {
  try {
    const collection = await getAgentMemoryCollection();

    const whereClause: any = {
      $and: [{ agentId: agentId.toString() }, { userAddress: userAddress }],
    };

    if (sessionId) {
      whereClause.$and.push({ sessionId });
    }

    const results = await collection.get({
      where: whereClause,
    });

    if (!results.documents || !results.metadatas) {
      return [];
    }

    const messages = results.documents
      .map((doc: any, idx: number) => ({
        content: doc || "",
        role: (results.metadatas?.[idx]?.role as string) || "",
        timestamp: parseInt(
          (results.metadatas?.[idx]?.timestamp as string) || "0"
        ),
      }))
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .reverse();

    return messages;
  } catch (error) {
    console.error("Error getting recent messages:", error);
    return [];
  }
}

/**
 * Get all chat sessions for an agent/user
 */
export async function getChatSessions(
  agentId: number,
  userAddress: string
): Promise<
  Array<{
    sessionId: string;
    lastMessage: string;
    timestamp: number;
    messageCount: number;
  }>
> {
  try {
    const collection = await getAgentMemoryCollection();

    const results = await collection.get({
      where: {
        $and: [{ agentId: agentId.toString() }, { userAddress: userAddress }],
      },
    });

    if (!results.documents || !results.metadatas) {
      return [];
    }

    const sessionMap = new Map<string, any>();

    results.documents.forEach((doc: any, idx: number) => {
      const metadata = results.metadatas?.[idx];
      const sessionId = (metadata?.sessionId as string) || "default";
      const timestamp = parseInt((metadata?.timestamp as string) || "0");

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          sessionId,
          lastMessage: doc || "",
          timestamp,
          messageCount: 0,
        });
      }

      const session = sessionMap.get(sessionId);
      session.messageCount++;

      if (timestamp > session.timestamp) {
        session.lastMessage = doc || "";
        session.timestamp = timestamp;
      }
    });

    return Array.from(sessionMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    return [];
  }
}

/**
 * Delete all memories for a specific agent/user or session
 */
export async function deleteAgentMemories(
  agentId: number,
  userAddress: string,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getAgentMemoryCollection();

    const whereClause: any = {
      $and: [{ agentId: agentId.toString() }, { userAddress: userAddress }],
    };

    if (sessionId) {
      whereClause.$and.push({ sessionId });
    }

    await collection.delete({
      where: whereClause,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting memories:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get memory statistics for an agent
 */
export async function getMemoryStats(
  agentId: number,
  userAddress: string
): Promise<{
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
}> {
  try {
    const collection = await getAgentMemoryCollection();

    const results = await collection.get({
      where: {
        $and: [{ agentId: agentId.toString() }, { userAddress: userAddress }],
      },
    });

    const totalMessages = results.ids?.length || 0;
    const userMessages =
      results.metadatas?.filter((m: any) => m?.role === "user").length || 0;
    const assistantMessages =
      results.metadatas?.filter((m: any) => m?.role === "assistant").length ||
      0;

    return {
      totalMessages,
      userMessages,
      assistantMessages,
    };
  } catch (error) {
    console.error("Error getting memory stats:", error);
    return {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
    };
  }
}

/**
 * Get all unique agent IDs that a user has chatted with
 */
export async function getChattedAgentIds(
  userAddress: string
): Promise<number[]> {
  try {
    const collection = await getAgentMemoryCollection();

    const results = await collection.get({
      where: { userAddress: userAddress },
    });

    if (!results.metadatas) {
      return [];
    }

    const agentIds = new Set<number>();
    results.metadatas.forEach((metadata: any) => {
      if (metadata?.agentId) {
        agentIds.add(parseInt(metadata.agentId));
      }
    });

    return Array.from(agentIds);
  } catch (error) {
    console.error("Error getting chatted agent IDs:", error);
    return [];
  }
}

/**
 * Get or create a collection for agent knowledge base.
 * No embeddingFunction — ChromaDB handles embedding server-side.
 */
export async function getKnowledgeBaseCollection(): Promise<Collection> {
  const client = getChromaClient();
  return await client.getOrCreateCollection({
    name: "agent_knowledge_base",
    metadata: { description: "Knowledge base documents for AI agents" },
  });
}

/**
 * Add documents to the knowledge base.
 * Pass documents only — ChromaDB generates embeddings server-side.
 */
export async function addToKnowledgeBase(
  knowledgeBaseId: string,
  documents: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getKnowledgeBaseCollection();

    const ids = documents.map(
      (_, idx) => `${knowledgeBaseId}_${Date.now()}_${idx}`
    );

    const metadatas = documents.map(() => ({
      knowledgeBaseId,
      timestamp: Date.now().toString(),
    }));

    await collection.add({
      ids,
      documents,
      metadatas,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error adding to knowledge base:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Search the knowledge base.
 * Uses queryTexts — ChromaDB embeds the query server-side.
 */
export async function searchKnowledgeBase(
  knowledgeBaseId: string,
  query: string,
  limit: number = 3
): Promise<string[]> {
  try {
    const collection = await getKnowledgeBaseCollection();

    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where: { knowledgeBaseId },
    });

    if (!results.documents?.[0]) {
      return [];
    }

    return results.documents[0].filter((doc: any): doc is string => doc !== null);
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return [];
  }
}

/**
 * Get list of agent IDs that the user has interacted with
 */
export async function getInteractedAgentIds(
  userAddress: string
): Promise<number[]> {
  try {
    const collection = await getAgentMemoryCollection();

    const results = await collection.get({
      where: { userAddress },
      include: ["metadatas"] as any,
    });

    if (!results.metadatas) {
      return [];
    }

    const agentIds = new Set<number>();
    results.metadatas.forEach((meta: any) => {
      if (meta.agentId) {
        agentIds.add(parseInt(meta.agentId));
      }
    });

    return Array.from(agentIds);
  } catch (error) {
    console.error("Error getting interacted agents:", error);
    return [];
  }
}
