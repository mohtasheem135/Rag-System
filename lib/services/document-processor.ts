import type { Document } from '@langchain/core/documents';
import { loadDocument } from '../loaders';
import {
  splitDocuments,
  getOptimalChunkSize,
} from '../splitters/text-splitter';
import { enhanceChunkMetadata, calculateChunkStats } from '../utils/metadata';
import { vectorStoreService } from '../vectorstore/chromadb';
import type { ProcessingResult, ProcessingStats } from '@/types/document';

export class DocumentProcessor {
  async processDocument(
    filepath: string,
    fileType: string,
    documentId: string,
    originalFilename: string,
    storeInVectorDB: boolean = true
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(`\n📄 Processing document: ${originalFilename}`);
      console.log(`   File type: ${fileType}`);
      console.log(`   Document ID: ${documentId}`);
      console.log(`   Store in Vector DB: ${storeInVectorDB}`);

      // Step 1: Load document
      console.log('\n⏳ Step 1: Loading document...');
      const documents = await loadDocument(filepath, fileType);
      console.log(`✅ Loaded ${documents.length} document(s)`);

      // Step 2: Split into chunks with optimal configuration
      console.log('\n⏳ Step 2: Splitting into chunks...');
      const documentType = this.getDocumentType(fileType);
      const chunkConfig = getOptimalChunkSize(documentType);
      console.log(
        `   Using chunk size: ${chunkConfig.chunkSize}, overlap: ${chunkConfig.chunkOverlap}`
      );

      const chunks = await splitDocuments(documents, chunkConfig);
      console.log(`✅ Created ${chunks.length} chunks`);

      // Step 3: Enhance metadata
      console.log('\n⏳ Step 3: Adding metadata to chunks...');
      const enhancedChunks = enhanceChunkMetadata(
        chunks,
        documentId,
        originalFilename,
        filepath
      );
      console.log(`✅ Metadata added to all chunks`);

      // Step 4: Generate embeddings and store in vector database
      let vectorIds: string[] = [];
      if (storeInVectorDB) {
        console.log(
          '\n⏳ Step 4: Generating embeddings and storing in ChromaDB...'
        );

        const vectorResult = await vectorStoreService.addDocuments(
          enhancedChunks
          // `doc_${documentId}` // Use document-specific collection
        );

        if (!vectorResult.success) {
          throw new Error(`Vector storage failed: ${vectorResult.error}`);
        }

        vectorIds = vectorResult.vectorIds;
        console.log(`✅ Stored ${vectorIds.length} vectors in ChromaDB`);
      }

      // Calculate statistics
      const stats = calculateChunkStats(enhancedChunks);
      const processingTime = Date.now() - startTime;

      const processingStats: ProcessingStats = {
        ...stats,
        processingTime,
      };

      console.log('\n📊 Processing Statistics:');
      console.log(`   Total chunks: ${stats.totalChunks}`);
      console.log(`   Avg chunk size: ${stats.avgChunkSize} chars`);
      console.log(
        `   Min/Max: ${stats.minChunkSize}/${stats.maxChunkSize} chars`
      );
      console.log(`   Processing time: ${processingTime}ms`);
      if (storeInVectorDB) {
        console.log(`   Vectors stored: ${vectorIds.length}`);
      }

      console.log('\n✅ Document processing completed successfully!\n');

      return {
        success: true,
        documentId,
        chunksCreated: enhancedChunks.length,
        chunks: enhancedChunks,
        stats: processingStats,
        vectorIds,
        message: 'Document processed and stored successfully',
      };
    } catch (error) {
      console.error('❌ Error processing document:', error);
      return {
        success: false,
        documentId,
        chunksCreated: 0,
        chunks: [],
        stats: {
          totalChunks: 0,
          avgChunkSize: 0,
          minChunkSize: 0,
          maxChunkSize: 0,
          totalCharacters: 0,
          processingTime: Date.now() - startTime,
        },
        vectorIds: [],
        message: 'Document processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getDocumentType(mimeType: string): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'text/plain': 'txt',
    };
    return typeMap[mimeType] || 'unknown';
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();
