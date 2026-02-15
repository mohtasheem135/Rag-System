import type { Document } from '@langchain/core/documents';

export interface UploadedDocument {
  id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  chunksCreated?: number;
  processingStats?: ProcessingStats;
  vectorIds?: string[];
}

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  chunks: Document[];
  stats: ProcessingStats;
  vectorIds?: string[]; // Add this
  message: string;
  error?: string;
}

export type SupportedFileType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain';

export const FILE_TYPE_EXTENSIONS: Record<SupportedFileType, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'text/plain': '.txt',
};

export interface ProcessingStats {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
  processingTime: number;
}
