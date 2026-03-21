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

    // Chunk large documents if needed
    const chunkedDocs: string[] = [];
    const MAX_CHUNK_SIZE = 1000; // characters per chunk

    for (const doc of documents) {
      if (doc.length <= MAX_CHUNK_SIZE) {
        chunkedDocs.push(doc);
      } else {
        // Split by paragraphs or sentences
        const paragraphs = doc.split(/\n\n+/);
        let currentChunk = '';

        for (const para of paragraphs) {
          if (currentChunk.length + para.length <= MAX_CHUNK_SIZE) {
            currentChunk += (currentChunk ? '\n\n' : '') + para;
          } else {
            if (currentChunk) {
              chunkedDocs.push(currentChunk);
            }
            currentChunk = para;
          }
        }

        if (currentChunk) {
          chunkedDocs.push(currentChunk);
        }
      }
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
