import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateFile } from '@/lib/utils/validation';
import { saveFile } from '@/lib/utils/file-storage';
import { documentProcessor } from '@/lib/services/document-processor';
import type { ApiResponse, UploadResponse } from '@/types/api';
import type { UploadedDocument } from '@/types/document';

// Store uploaded documents in memory (use database in production)
const uploadedDocuments = new Map<string, UploadedDocument>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Save file to disk
    const { filepath, filename } = await saveFile(file);

    // Create document record
    const documentId = uuidv4();
    const document: UploadedDocument = {
      id: documentId,
      filename,
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'processing',
    };

    // Store document metadata
    uploadedDocuments.set(documentId, document);

    console.log(`\n📤 File uploaded: ${filename} (ID: ${documentId})`);

    // Process document immediately
    try {
      const result = await documentProcessor.processDocument(
        filepath,
        file.type,
        documentId,
        file.name
      );

      if (result.success) {
        document.status = 'completed';
        document.chunksCreated = result.chunksCreated;
        document.processingStats = result.stats;
        document.vectorIds = result.vectorIds; // Add this
        uploadedDocuments.set(documentId, document);

        return NextResponse.json<ApiResponse<UploadResponse>>(
          {
            success: true,
            data: {
              documentId,
              filename: file.name,
              status: 'completed',
              chunksCreated: result.chunksCreated,
              vectorsStored: result.vectorIds?.length || 0, // Add this
              stats: result.stats,
            },
            message: `File processed successfully. Created ${result.chunksCreated} chunks and stored ${result.vectorIds?.length || 0} vectors.`,
          },
          { status: 200 }
        );
      } else {
        document.status = 'failed';
        document.error = result.error;
        uploadedDocuments.set(documentId, document);

        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: result.error || 'Processing failed',
            message: 'Document uploaded but processing failed',
          },
          { status: 500 }
        );
      }
    } catch (processingError) {
      document.status = 'failed';
      document.error =
        processingError instanceof Error
          ? processingError.message
          : 'Unknown error';
      uploadedDocuments.set(documentId, document);

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: document.error,
          message: 'Document uploaded but processing failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

// Keep existing GET endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Document ID required' },
      { status: 400 }
    );
  }

  const document = uploadedDocuments.get(documentId);

  if (!document) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Document not found' },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<UploadedDocument>>(
    { success: true, data: document },
    { status: 200 }
  );
}
