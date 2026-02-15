import type { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';

export interface EnhancedMetadata {
  source: string;
  document_id: string;
  chunk_id: string;
  chunk_index: number;
  total_chunks: number;
  chunk_size: number;
  timestamp: string;
  page_number?: number;
  total_pages?: number;
  document_type?: string;
  original_filename: string;
}

export function enhanceChunkMetadata(
  chunks: Document[],
  documentId: string,
  originalFilename: string,
  filepath: string
): Document[] {
  return chunks.map((chunk, index) => {
    const enhancedMetadata: EnhancedMetadata = {
      // Original metadata
      ...chunk.metadata,

      // Document identifiers
      source: filepath,
      document_id: documentId,
      chunk_id: uuidv4(),
      original_filename: originalFilename,

      // Chunk information
      chunk_index: index,
      total_chunks: chunks.length,
      chunk_size: chunk.pageContent.length,

      // Timestamp
      timestamp: new Date().toISOString(),
    };

    return {
      ...chunk,
      metadata: enhancedMetadata,
    };
  });
}

// Extract preview text for display
export function getChunkPreview(
  content: string,
  maxLength: number = 100
): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

// Calculate statistics for chunks
export interface ChunkStatistics {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
}

export function calculateChunkStats(chunks: Document[]): ChunkStatistics {
  const sizes = chunks.map(c => c.pageContent.length);

  return {
    totalChunks: chunks.length,
    avgChunkSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalCharacters: sizes.reduce((a, b) => a + b, 0),
  };
}
