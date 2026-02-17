import { NextRequest, NextResponse } from 'next/server';
import { vectorStoreService } from '@/lib/vectorstore/chromadb';
import type { ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionName = searchParams.get('collectionName');

    // Validate that collectionName is provided
    if (!collectionName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Collection name is required',
        },
        { status: 400 }
      );
    }

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
