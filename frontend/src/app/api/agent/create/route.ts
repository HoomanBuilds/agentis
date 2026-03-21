import { NextRequest, NextResponse } from 'next/server';
import { uploadAgentMetadata, uploadFileToPinata, getIPFSUri } from '@/lib/pinata';
import { generatePersonalityHash } from '@/lib/openai';

interface CreateAgentRequest {
  name: string;
  description: string;
  personality: {
    role?: string;
    tone?: string;
    style?: string;
    knowledge_focus?: string[];
    likes?: string[];
    dislikes?: string[];
    backstory?: string;
  };
  imageBase64?: string;
}

/**
 * POST /api/agent/create
 * Create agent metadata and upload to IPFS
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateAgentRequest = await request.json();
    const { name, description, personality, imageBase64 } = body;

    if (!name || !description || !personality) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, personality' },
        { status: 400 }
      );
    }

    let imageHash: string | null = null;
    if (imageBase64) {
      // Convert base64 to File
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: 'image/png' });
      const file = new File([blob], `${name}-avatar.png`, { type: 'image/png' });
      imageHash = await uploadFileToPinata(file);
    }

    const personalityHash = generatePersonalityHash(personality);

    // Build attributes from personality
    const attributes = [
      { trait_type: 'Role', value: personality.role || 'AI Assistant' },
      { trait_type: 'Tone', value: personality.tone || 'friendly' },
      { trait_type: 'Style', value: personality.style || 'conversational' },
    ];

    if (personality.knowledge_focus?.length) {
      attributes.push({ 
        trait_type: 'Expertise', 
        value: personality.knowledge_focus.join(', ') 
      });
    }

    const { hash: metadataHash, uri: tokenUri } = await uploadAgentMetadata(
      name,
      description,
      imageHash,
      personality,
      attributes
    );

    return NextResponse.json({
      success: true,
      metadataHash,
      tokenUri,
      personalityHash,
      imageHash,
      mintParams: {
        name,
        tokenUri,
        personalityHash,
      },
    });
  } catch (error) {
    console.error('Create agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to create agent metadata' },
      { status: 500 }
    );
  }
}
