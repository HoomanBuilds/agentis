import { NextRequest, NextResponse } from "next/server";
import { streamAgentResponse } from "@/lib/openai";
import { checkUserCredits, isBackendWalletConfigured } from "@/lib/credits";
import { checkSessionCredits } from "@/lib/session-credits";
import { getAgentWalletPublicKey, getAgentBalance, agentPurchaseCredits } from "@/lib/agent-wallet";
import { spendCreditsAndRecordChat, useSessionAndRecordChat } from "@/lib/backend-wallet";
import { storeMessage } from "@/lib/vectordb";
import { CONTRACTS } from "@/constants/contracts";

/**
 * POST /api/chat
 * 
 * OWNER FLOW:
 * 1. Check user credits → use if available
 * 2. Check agent wallet → auto-pay if sufficient funds
 * 3. Return 402 with payment options
 * 
 * NON-OWNER FLOW:
 * 1. Check session credits → use if available
 * 2. Return 402 for session purchase
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      agentId, 
      tokenUri, 
      message, 
      chatHistory = [], 
      userPublicKey,
      isOwner = false,
      sessionId,  
    } = await req.json();

    if (!agentId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: agentId and message" },
        { status: 400 }
      );
    }

    if (!userPublicKey) {
      return NextResponse.json(
        { error: "Missing userPublicKey for credit billing" },
        { status: 400 }
      );
    }

    let paymentMethod: 'credits' | 'agent-wallet' | 'session' | 'skip' = 'skip';

    if (isBackendWalletConfigured()) {
      // =====================
      // OWNER FLOW
      // =====================
      if (isOwner) {
        // Step 1: Check user credits
        const creditCheck = await checkUserCredits(userPublicKey, 1);
        console.log(`[OWNER] Credit check: balance=${creditCheck.balance}, hasCredits=${creditCheck.hasCredits}`);

        if (creditCheck.hasCredits) {
          paymentMethod = 'credits';
        } else {
          // Step 2: Check agent wallet balance
          try {
            const agentBalanceStr = await getAgentBalance(agentId);
            const agentBalanceSTRK = parseFloat(agentBalanceStr);
            const requiredSTRK = 0.15;

            console.log(`[OWNER] Agent wallet: balance=${agentBalanceSTRK} STRK, required=${requiredSTRK}`);

            if (agentBalanceSTRK >= requiredSTRK) {
              // Auto-pay with agent wallet
              const autoPay = await agentPurchaseCredits(agentId, 1);
              if (autoPay.success) {
                console.log(`[OWNER] Agent auto-pay success: ${autoPay.transactionHash}`);
                paymentMethod = 'agent-wallet';
              } else {
                console.error(`[OWNER] Agent auto-pay failed: ${autoPay.error}`);
              }
            }
          } catch (error) {
            console.error('[OWNER] Agent wallet check error:', error);
          }
        }

        // Step 3: Return 402 if no payment method succeeded
        if (paymentMethod === 'skip') {
          return NextResponse.json(
            { 
              error: "Insufficient credits",
              code: "PAYMENT_REQUIRED",
              paymentRequired: {
                type: "owner-credits",
                agentId,
                cost: "0.1",
                currency: "STRK",
                description: "You don't have enough credits. Your agent wallet is also empty.",
              }
            },
            { status: 402 }
          );
        }
      } 
      // =====================
      // NON-OWNER FLOW
      // =====================
      else {
        // Step 1: Check session credits for this agent
        const sessionCheck = await checkSessionCredits(userPublicKey, agentId);
        console.log(`[NON-OWNER] Session credits: balance=${sessionCheck.balance}, hasCredits=${sessionCheck.hasCredits}`);

        if (sessionCheck.hasCredits) {
          paymentMethod = 'session';
        } else {
          // Step 2: Return 402 for session purchase
          return NextResponse.json(
            { 
              error: "Session required",
              code: "PAYMENT_REQUIRED",
              paymentRequired: {
                type: "session-credits",
                agentId,
                cost: "5",
                currency: "STRK",
                description: "Purchase a session pack (50 messages) to chat with this agent.",
                nftContract: CONTRACTS.addresses.AgentNFT,
              }
            },
            { status: 402 }
          );
        }
      }
    }

    // =====================
    // PROCESS CHAT
    // =====================
    
    // Fetch agent personality from IPFS
    let personality = {
      name: `Agent #${agentId}`,
      description: "A helpful AI assistant.",
      traits: ["helpful", "friendly"],
    };

    if (tokenUri) {
      try {
        const cid = tokenUri.replace("ipfs://", "");
        // Prefer NEXT_PUBLIC_BASE_URL (production) over VERCEL_URL (preview URLs may have auth)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const ipfsResponse = await fetch(`${baseUrl}/api/ipfs/fetch?cid=${cid}`);
        
        if (ipfsResponse.ok) {
          const ipfsMetadata = await ipfsResponse.json();
          personality = {
            name: ipfsMetadata.name || personality.name,
            description: ipfsMetadata.description || personality.description,
            traits: ipfsMetadata.traits || personality.traits,
          };
          console.log("Loaded personality from IPFS:", personality.name);
        }
      } catch (err) {
        console.error("Error fetching IPFS personality:", err);
      }
    }

    // =====================
    // STORE USER MESSAGE
    // =====================
    try {
      await storeMessage(agentId, userPublicKey, 'user', message, Date.now(), sessionId || 'default');
    } catch (err) {
      console.error('[CHAT] Error storing user message:', err);
    }

    const response = await streamAgentResponse(personality, message, chatHistory);

    // =====================
    // SPEND + RECORD (must complete before returning response)
    // =====================
    if (paymentMethod === 'credits') {
      try {
        const result = await spendCreditsAndRecordChat(userPublicKey, agentId, `Chat with Agent #${agentId}`);
        if (result.success) {
          console.log(`[CREDITS+RECORD] tx: ${result.transactionHash}`);
        } else {
          console.error(`[CREDITS+RECORD] Failed: ${result.error}`);
        }
      } catch (err) {
        console.error("[CREDITS+RECORD] Error:", err);
      }
    } else if (paymentMethod === 'session') {
      try {
        const result = await useSessionAndRecordChat(userPublicKey, agentId);
        if (result.success) {
          console.log(`[SESSION+RECORD] tx: ${result.transactionHash}`);
        } else {
          console.error(`[SESSION+RECORD] Failed: ${result.error}`);
        }
      } catch (err) {
        console.error("[SESSION+RECORD] Error:", err);
      }
    }

    return response;

  } catch (error: unknown) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
