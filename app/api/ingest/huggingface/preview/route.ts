// app/api/ingest/huggingface/preview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { HuggingFaceDatasetLoader } from '@/lib/loaders/hf-loader';
import type { ApiResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetName, split, pageContentColumn, config } = body;

    if (!datasetName || !pageContentColumn) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Dataset name and page content column are required',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Previewing HF dataset: ${datasetName}`);

    const loader = new HuggingFaceDatasetLoader({
      datasetName,
      split: split || 'train',
      pageContentColumn,
      config,
    });

    const documents = await loader.load();

    // Return first 5 documents with preview
    const preview = documents.slice(0, 5).map((doc, idx) => ({
      index: idx,
      contentLength: doc.pageContent.length,
      contentPreview: doc.pageContent.substring(0, 200) + '...',
      fullContent: doc.pageContent, // Include full content for inspection
      metadata: doc.metadata,
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalDocuments: documents.length,
        preview,
        allDocumentsValid: documents.every(
          doc => doc.pageContent && doc.pageContent.trim().length > 0
        ),
      },
      message: `Preview loaded: ${documents.length} documents`,
    });
  } catch (error) {
    console.error('❌ Preview error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Preview failed',
      },
      { status: 500 }
    );
  }
}
