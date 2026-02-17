// app/api/vectorstore/collections/[name]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { VectorStoreService } from '@/lib/vectorstore/chromadb';
import type { ApiResponse } from '@/types/api';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ name: string }> } // FIXED: params is now a Promise
) {
  try {
    // FIXED: Await the params
    const { name } = await context.params;
    const collectionName = decodeURIComponent(name);

    console.log(`🗑️ DELETE request for collection: "${collectionName}"`);

    if (!collectionName) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Collection name is required',
        },
        { status: 400 }
      );
    }

    const vectorStore = new VectorStoreService();
    const deleted = await vectorStore.deleteCollection(collectionName);

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Failed to delete collection "${collectionName}"`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Collection "${collectionName}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete collection',
      },
      { status: 500 }
    );
  }
}
