import { NextRequest, NextResponse } from 'next/server';
import { vectorStoreService } from '@/lib/vectorstore/chromadb';
import type { ApiResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, k = 4, collectionName } = body;

    if (!query) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!collectionName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Collection name is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching in collection: ${collectionName}`);
    console.log(`   Query: "${query}"`);
    console.log(`   K: ${k}`);

    // Perform similarity search with scores
    const results = await vectorStoreService.similaritySearchWithScore(
      query,
      k,
      collectionName
    );

    console.log(`✅ Found ${results.length} results`);

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
        collection: collectionName,
      },
      message: `Found ${formattedResults.length} similar documents in "${collectionName}"`,
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
