import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import type { Document } from '@langchain/core/documents';

export interface ChunkingConfig {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

// Default configuration following best practices
const DEFAULT_CONFIG: ChunkingConfig = {
  chunkSize: 1200, // ~300 tokens (1 token ≈ 4 characters)
  chunkOverlap: 200, // 20% overlap for context preservation
  separators: ['\n\n', '\n', '. ', ' ', ''], // Hierarchical splitting
};

export async function splitDocuments(
  documents: Document[],
  config: Partial<ChunkingConfig> = {}
): Promise<Document[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: finalConfig.chunkSize,
    chunkOverlap: finalConfig.chunkOverlap,
    separators: finalConfig.separators,
    lengthFunction: (text: string) => text.length,
  });

  try {
    const chunks = await textSplitter.splitDocuments(documents);

    console.log(`Documents split into ${chunks.length} chunks`);
    console.log(
      `Avg chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.pageContent.length, 0) / chunks.length)} chars`
    );

    return chunks;
  } catch (error) {
    console.error('Error splitting documents:', error);
    throw new Error('Failed to split documents into chunks');
  }
}

// Calculate optimal chunk size based on document type
export function getOptimalChunkSize(documentType: string): ChunkingConfig {
  switch (documentType) {
    case 'pdf':
      // PDFs often have structured content
      return {
        chunkSize: 1500,
        chunkOverlap: 250,
      };
    case 'docx':
      // DOCX usually narrative content
      return {
        chunkSize: 1200,
        chunkOverlap: 200,
      };
    case 'txt':
      // Plain text, smaller chunks
      return {
        chunkSize: 1000,
        chunkOverlap: 150,
      };
    default:
      return DEFAULT_CONFIG;
  }
}
