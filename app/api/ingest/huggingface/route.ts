// app/api/ingest/huggingface/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { HuggingFaceDatasetLoader } from '@/lib/loaders/hf-loader';
import { documentProcessor } from '@/lib/services/document-processor';
import type { ApiResponse, UploadResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      datasetName,
      split,
      pageContentColumn,
      metadataColumns,
      config,
      collectionName, // ✅ ADD THIS LINE!
    } = body;

    console.log('📦 Received HuggingFace upload request');
    console.log('   Dataset:', datasetName);
    console.log('   Split:', split || 'train');
    console.log('   Column:', pageContentColumn);
    console.log('   Collection:', collectionName || 'default'); // ✅ Log it
    console.log('   Config:', config || 'none');

    if (!datasetName || !pageContentColumn) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Dataset name and page content column are required',
        },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting HF dataset ingestion: ${datasetName}`);

    const documentId = uuidv4();

    // Load dataset using our HF loader
    const loader = new HuggingFaceDatasetLoader({
      datasetName,
      split: split || 'train',
      pageContentColumn,
      metadataColumns,
      config,
    });

    const documents = await loader.load();

    if (documents.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'No documents loaded from dataset',
        },
        { status: 400 }
      );
    }

    console.log(`✅ Loaded ${documents.length} documents from HuggingFace`);

    // Process through existing pipeline
    const result = await documentProcessor.processDocuments(
      documents, // Document[]
      documentId, // string
      datasetName, // sourceName: string
      'huggingface', // documentType: string
      true, // storeInVectorDB: boolean
      Date.now(), // startTime: number
      collectionName // ✅ PASS IT HERE!
    );

    if (result.success) {
      return NextResponse.json<ApiResponse<UploadResponse>>(
        {
          success: true,
          data: {
            documentId,
            filename: `hf://${datasetName}`,
            status: 'completed',
            chunksCreated: result.chunksCreated,
            vectorsStored: result.vectorIds?.length || 0,
            stats: result.stats,
          },
          message: `Successfully processed ${result.chunksCreated} chunks from HF dataset into collection "${collectionName || 'default'}"`,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: result.error || 'Processing failed',
          message: 'Dataset loaded but processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ HF ingestion error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ingestion failed',
      },
      { status: 500 }
    );
  }
}
