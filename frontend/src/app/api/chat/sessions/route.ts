import { NextRequest, NextResponse } from "next/server";
import { getChatSessions } from "@/lib/vectordb";

/**
 * GET /api/chat/sessions?agentId=1&userAddress=0x...
 * Get all chat sessions for a specific agent and user
 */
export async function GET(req: NextRequest) {
  try {
    // NOTE: Authentication removed - sessions are filtered by userAddress parameter
    // The user can only query their own sessions by providing their address

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const userAddress = searchParams.get("userAddress");

    if (!agentId || !userAddress) {
      return NextResponse.json(
        { error: "Missing agentId or userAddress" },
        { status: 400 }
      );
    }

    const sessions = await getChatSessions(parseInt(agentId), userAddress);

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching chat sessions:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch chat sessions";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
