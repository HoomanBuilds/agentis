import { NextRequest, NextResponse } from 'next/server';
import { addToKnowledgeBase } from '@/lib/vectordb';

interface UploadKnowledgeRequest {
  knowledgeBaseId: string;
  documents: string[];
}

/**
 * POST /api/knowledge-base/upload
 * Upload documents to agent's knowledge base for RAG
 */
export async function POST(request: NextRequest) {
  try {
    const body: UploadKnowledgeRequest = await request.json();
    const { knowledgeBaseId, documents } = body;

    if (!knowledgeBaseId || !documents?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: knowledgeBaseId, documents' },
        { status: 400 }
      );
    }

    // Split documents into ~800-character paragraph chunks for better retrieval.
    const CHUNK_SIZE = 800;
    const chunkedDocs: string[] = [];

    for (const doc of documents) {
      const paragraphs = doc.split(/\n\n+/);
      let current = '';
      for (const para of paragraphs) {
        if (current.length + para.length > CHUNK_SIZE && current.length > 0) {
          chunkedDocs.push(current.trim());
          current = '';
        }
        current += (current ? '\n\n' : '') + para;
      }
      if (current.trim()) chunkedDocs.push(current.trim());
    }

    const result = await addToKnowledgeBase(knowledgeBaseId, chunkedDocs);

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      documentsAdded: chunkedDocs.length,
      knowledgeBaseId,
    });
  } catch (error) {
    console.error('Knowledge base upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to knowledge base' },
      { status: 500 }
    );
  }
}
