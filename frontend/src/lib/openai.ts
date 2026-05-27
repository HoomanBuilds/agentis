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
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return hexHash.repeat(8);
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
 * Stream AI response with personality injection.
 * Calls DeepSeek directly via fetch to avoid @ai-sdk/openai's model detection
 * which incorrectly classifies non-OpenAI models as "reasoning models" and
 * sends role:"developer" — a role DeepSeek doesn't support.
 */
export async function streamAgentResponse(
  personality: {
    name?: string;
    description?: string;
    traits?: string[];
  },
  userMessage: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<Response> {
  const systemPrompt = buildPersonalityPrompt(personality);

  const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: true,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!deepseekResponse.ok) {
    const err = await deepseekResponse.text();
    throw new Error(`DeepSeek API error ${deepseekResponse.status}: ${err}`);
  }

  // Parse SSE from DeepSeek and stream plain text to the client.
  // The frontend (useAgentChat) reads raw text chunks and concatenates them.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = deepseekResponse.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
