// app/api/vectorstore/collections/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { VectorStoreService } from '@/lib/vectorstore/chromadb';
import type { ApiResponse } from '@/types/api';

// GET - List all collections
export async function GET() {
  try {
    const vectorStore = new VectorStoreService();
    const collections = await vectorStore.listCollections();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch collections',
      },
      { status: 500 }
    );
  }
}

// POST - Create new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Collection name is required',
        },
        { status: 400 }
      );
    }

    const vectorStore = new VectorStoreService();
    await vectorStore.createCollection(name.trim());

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Collection "${name}" created successfully`,
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create collection',
      },
      { status: 500 }
    );
  }
}
