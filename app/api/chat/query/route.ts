// app/api/chat/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ragChainService } from '@/lib/chains/rag-chain';
import { chatHistoryManager } from '@/lib/memory/chat-history';
import type { ApiResponse } from '@/types/api';
import type { ChatResponse, SourceDocument } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, question, collectionName, k = 4 } = body;

    if (!sessionId || !question) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session ID and question are required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = chatHistoryManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Session not found. Create a session first.' },
        { status: 404 }
      );
    }

    console.log(`\n💬 Processing chat query for session: ${sessionId}`);

    // Query with history
    const result = await ragChainService.queryWithHistory(
      sessionId,
      question,
      collectionName || session.collectionName,
      k
    );

    // Map documents to SourceDocument type with proper metadata
    const sources: SourceDocument[] = result.sources.map(doc => ({
      content: doc.pageContent,
      metadata: {
        source: doc.metadata.source || doc.metadata.filepath || 'unknown',
        page_number:
          doc.metadata.page_number ||
          doc.metadata.page ||
          doc.metadata.loc?.pageNumber,
        chunk_index: doc.metadata.chunk_index || doc.metadata.chunkIndex,
        original_filename:
          doc.metadata.original_filename ||
          doc.metadata.originalFilename ||
          doc.metadata.filename,
      },
      score: doc.metadata.score,
    }));

    const response: ChatResponse = {
      answer: result.answer,
      sources,
      sessionId,
      messageId: result.messageId,
    };

    return NextResponse.json<ApiResponse<ChatResponse>>({
      success: true,
      data: response,
      message: 'Query processed successfully',
    });
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Query failed',
      },
      { status: 500 }
    );
  }
}
