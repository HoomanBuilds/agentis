import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/**
 * Generate a simple hash from personality object
 * This creates a deterministic string that can be stored on-chain
 */
export function generatePersonalityHash(personality: Record<string, unknown>): string {
  const str = JSON.stringify(personality);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex and pad to 64 chars (simulating a hash)
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return hexHash.repeat(8); // 64 character hex string
}

/**
 * Build personality-injected system prompt from agent metadata
 */
export function buildPersonalityPrompt(personality: {
  name?: string;
  description?: string;
  traits?: string[];
}): string {
  const { name, description, traits } = personality;

  return `You are an AI agent named "${name || 'Agent'}".

PERSONALITY:
${description || 'You are a helpful AI assistant.'}

TRAITS: ${traits?.join(', ') || 'helpful, friendly, knowledgeable'}

INSTRUCTIONS:
- Stay in character at all times
- Be helpful and engaging
- Provide accurate information when possible
- If you don't know something, say so honestly
- Keep responses concise but informative
- Use markdown formatting when appropriate (code blocks, lists, etc.)

Always respond as ${name || 'the agent'}, maintaining the personality described above.`;
}

/**
 * Stream AI response with personality injection
 */
export async function streamAgentResponse(
  personality: {
    name?: string;
    description?: string;
    traits?: string[];
  },
  userMessage: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  const systemPrompt = buildPersonalityPrompt(personality);

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    messages: [
      ...chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
    temperature: 0.8,
  });

  return result.toTextStreamResponse();
}
