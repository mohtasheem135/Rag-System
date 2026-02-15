import { NextRequest, NextResponse } from 'next/server';
import { vectorStoreService } from '@/lib/vectorstore/chromadb';
import type { ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    const collectionName = documentId ? `doc_${documentId}` : undefined;
    const stats = await vectorStoreService.getCollectionStats(collectionName);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: stats,
      message: 'Stats retrieved successfully',
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      },
      { status: 500 }
    );
  }
}
