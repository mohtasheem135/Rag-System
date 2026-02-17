// app/api/ingest/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { validateFile } from '@/lib/utils/validation';
import { saveFile } from '@/lib/utils/file-storage';
import { documentProcessor } from '@/lib/services/document-processor';
import type { ApiResponse, UploadResponse } from '@/types/api';
import type { UploadedDocument, ProcessingResult } from '@/types/document';

// Store uploaded documents in memory (use database in production)
const uploadedDocuments = new Map<string, UploadedDocument>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const collectionName = formData.get('collectionName') as string | null;

    // CSV-specific options
    const csvColumn = formData.get('csvColumn') as string | null;
    const csvCombinedColumns = formData.get('csvCombinedColumns') === 'true';

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

    // Create document record
    const documentId = uuidv4();
    const document: UploadedDocument = {
      id: documentId,
      filename: file.name,
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'processing',
    };

    // Store document metadata
    uploadedDocuments.set(documentId, document);

    console.log(`\n📤 File uploaded: ${file.name} (ID: ${documentId})`);
    console.log(`   File type: ${file.type}`);
    console.log(`   File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Collection: ${collectionName || 'default'}`);

    // Save file to disk
    const { filepath, filename } = await saveFile(file);

    try {
      let result: ProcessingResult;

      // Check if file is CSV
      const isCSV =
        file.type === 'text/csv' ||
        file.type === 'application/csv' ||
        file.name.toLowerCase().endsWith('.csv');

      if (isCSV) {
        console.log('📊 Processing CSV file...');
        if (csvColumn) {
          console.log(`   Column: ${csvColumn}`);
        }
        if (csvCombinedColumns) {
          console.log(`   Mode: Combined columns`);
        }

        // Dynamically import CSV loader
        const { loadCSV } = await import('@/lib/loaders/csv-loader');

        // Load CSV with options
        const documents = await loadCSV(filepath, {
          column: csvColumn || undefined,
          combinedColumns: csvCombinedColumns,
        });

        console.log(`✅ Loaded ${documents.length} rows from CSV`);

        // Process the loaded documents
        result = await documentProcessor.processDocuments(
          documents,
          documentId,
          file.name,
          'csv',
          true,
          Date.now(),
          collectionName || undefined
        );
      } else {
        // Regular file processing (PDF, DOCX, TXT)
        console.log('📄 Processing document...');
        result = await documentProcessor.processDocument(
          filepath,
          file.type,
          documentId,
          file.name,
          true,
          collectionName || undefined
        );
      }

      if (result.success) {
        document.status = 'completed';
        document.chunksCreated = result.chunksCreated;
        document.processingStats = result.stats;
        document.vectorIds = result.vectorIds;
        uploadedDocuments.set(documentId, document);

        console.log('✅ Processing completed successfully');

        return NextResponse.json<ApiResponse<UploadResponse>>(
          {
            success: true,
            data: {
              documentId,
              filename: file.name,
              status: 'completed',
              chunksCreated: result.chunksCreated,
              vectorsStored: result.vectorIds?.length || 0,
              stats: result.stats,
            },
            message:
              result.message ||
              `File processed successfully. Created ${result.chunksCreated} chunks and stored ${result.vectorIds?.length || 0} vectors.`,
          },
          { status: 200 }
        );
      } else {
        document.status = 'failed';
        document.error = result.error;
        uploadedDocuments.set(documentId, document);

        console.error('❌ Processing failed:', result.error);

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

      console.error('❌ Processing error:', processingError);

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
    console.error('❌ Upload error:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}

// Get document status
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

// Optional: Delete document
export async function DELETE(request: NextRequest) {
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

  // Remove from memory
  uploadedDocuments.delete(documentId);

  return NextResponse.json<ApiResponse>(
    {
      success: true,
      message: `Document ${documentId} deleted successfully`,
    },
    { status: 200 }
  );
}
