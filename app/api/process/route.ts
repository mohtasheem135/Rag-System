import { NextRequest, NextResponse } from 'next/server';
import { documentProcessor } from '@/lib/services/document-processor';
import { getFilePath } from '@/lib/utils/file-storage';
import type { ApiResponse } from '@/types/api';
import type { ProcessingResult } from '@/types/document';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, filename, fileType, originalName } = body;

    if (!documentId || !filename || !fileType || !originalName) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get file path
    const filepath = getFilePath(filename);

    console.log(`\n🚀 Starting document processing...`);
    console.log(`   Document ID: ${documentId}`);
    console.log(`   Filename: ${filename}`);

    // Process document
    const result = await documentProcessor.processDocument(
      filepath,
      fileType,
      documentId,
      originalName
    );

    if (!result.success) {
      return NextResponse.json<ApiResponse<ProcessingResult>>(
        {
          success: false,
          data: result,
          error: result.error,
          message: 'Processing failed',
        },
        { status: 500 }
      );
    }

    console.log(`\n✅ Processing completed successfully!`);

    return NextResponse.json<ApiResponse<ProcessingResult>>(
      {
        success: true,
        data: result,
        message: 'Document processed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Processing endpoint error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      },
      { status: 500 }
    );
  }
}
