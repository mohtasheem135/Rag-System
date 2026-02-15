import { NextRequest, NextResponse } from 'next/server';
import { vectorStoreService } from '@/lib/vectorstore/chromadb';
import type { ApiResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, k = 4, documentId } = body;

    if (!query) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const collectionName = documentId ? `doc_${documentId}` : undefined;

    // Perform similarity search with scores
    const results = await vectorStoreService.similaritySearchWithScore(
      query,
      k,
      collectionName
    );

    // Format results
    const formattedResults = results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score,
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        query,
        results: formattedResults,
        count: formattedResults.length,
      },
      message: `Found ${formattedResults.length} similar documents`,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
