// lib/loaders/index.ts

import type { Document } from '@langchain/core/documents';
import { loadPDF } from './pdf-loader';
import { loadDOCX } from './doc-loader';
import { loadText } from './text-loader';

export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'csv';

export async function loadDocument(
  filepath: string,
  fileType: string
): Promise<Document[]> {
  const type = getFileType(fileType);

  console.log(`📂 Loading document: ${filepath}`);
  console.log(`   File type: ${type} (${fileType})`);

  try {
    let documents: Document[];

    switch (type) {
      case 'pdf':
        documents = await loadPDF(filepath);
        break;
      case 'docx':
        documents = await loadDOCX(filepath);
        break;
      case 'txt':
        documents = await loadText(filepath);
        break;
      case 'csv':
        // CSV support can be added here when needed
        throw new Error('CSV support not yet implemented');
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log(
      `✅ Loaded ${documents.length} document(s) from ${type.toUpperCase()}`
    );
    return documents;
  } catch (error) {
    console.error(`❌ Error loading document:`, error);
    throw new Error(
      `Failed to load ${type.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function getFileType(mimeType: string): SupportedFileType {
  const typeMap: Record<string, SupportedFileType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/csv': 'csv',
    'application/vnd.ms-excel': 'csv', // Sometimes CSV is detected as this
  };

  const type = typeMap[mimeType];
  if (!type) {
    throw new Error(
      `Unsupported MIME type: ${mimeType}. Supported types: ${Object.keys(typeMap).join(', ')}`
    );
  }

  return type;
}

// Helper function to validate file extension matches MIME type
export function validateFileType(
  filename: string,
  mimeType: string
): { valid: boolean; reason?: string } {
  const extension = filename.split('.').pop()?.toLowerCase();
  const detectedType = getFileType(mimeType);

  if (!extension) {
    return { valid: false, reason: 'No file extension found' };
  }

  const extensionMap: Record<string, SupportedFileType> = {
    pdf: 'pdf',
    docx: 'docx',
    doc: 'docx',
    txt: 'txt',
    csv: 'csv',
  };

  const expectedType = extensionMap[extension];

  if (!expectedType) {
    return {
      valid: false,
      reason: `Unsupported file extension: .${extension}`,
    };
  }

  if (expectedType !== detectedType) {
    return {
      valid: false,
      reason: `File extension (.${extension}) does not match MIME type (${mimeType})`,
    };
  }

  return { valid: true };
}

// Helper function to get supported file types info
export function getSupportedFileTypes(): {
  extensions: string[];
  mimeTypes: string[];
  description: string;
} {
  return {
    extensions: ['pdf', 'docx', 'txt', 'csv'],
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
    ],
    description: 'PDF, DOCX, TXT, and CSV files are supported',
  };
}

// Re-export individual loaders for direct use
export { loadPDF, loadDOCX, loadText };
