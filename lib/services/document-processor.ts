import { Document } from '@langchain/core/documents';
import { loadDocument } from '../loaders';
import {
  splitDocuments,
  getOptimalChunkSize,
} from '../splitters/text-splitter';
import { enhanceChunkMetadata, calculateChunkStats } from '../utils/metadata';
import { cleanText, isValidChunk } from '../utils/text-cleaning';
import { vectorStoreService } from '../vectorstore/chromadb';
import type { ProcessingResult, ProcessingStats } from '@/types/document';

export class DocumentProcessor {
  // Existing method for file-based processing
  async processDocument(
    filepath: string,
    fileType: string,
    documentId: string,
    originalFilename: string,
    storeInVectorDB: boolean = true,
    collectionName?: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(`\n📄 Processing document: ${originalFilename}`);
      console.log(`   File type: ${fileType}`);
      console.log(`   Document ID: ${documentId}`);
      console.log(`   Collection: ${collectionName || 'default'}`);
      console.log(`   Store in Vector DB: ${storeInVectorDB}`);

      // Step 1: Load document
      console.log('\n⏳ Step 1: Loading document...');
      const documents = await loadDocument(filepath, fileType);
      console.log(`✅ Loaded ${documents.length} document(s)`);

      // Use the new generic method
      const documentType = this.getDocumentType(fileType);
      return await this.processDocuments(
        documents,
        documentId,
        originalFilename,
        documentType,
        storeInVectorDB,
        startTime,
        collectionName
      );
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

  // Generic method to process any array of LangChain Documents
  async processDocuments(
    documents: Document[],
    documentId: string,
    sourceName: string,
    documentType: string = 'default',
    storeInVectorDB: boolean = true,
    startTime: number = Date.now(),
    collectionName?: string
  ): Promise<ProcessingResult> {
    try {
      // Step 1.5: Clean the raw documents first
      console.log('\n⏳ Step 1.5: Cleaning document text...');
      const cleanedDocuments = documents.map(doc => {
        const cleanedContent = cleanText(doc.pageContent);
        return new Document({
          pageContent: cleanedContent,
          metadata: { ...doc.metadata },
        });
      });

      const totalCharsOriginal = documents.reduce(
        (sum, doc) => sum + doc.pageContent.length,
        0
      );
      const totalCharsCleaned = cleanedDocuments.reduce(
        (sum, doc) => sum + doc.pageContent.length,
        0
      );
      console.log(
        `✅ Text cleaned (${totalCharsOriginal} → ${totalCharsCleaned} chars)`
      );

      // Step 2: Split into chunks with optimal configuration
      console.log('\n⏳ Step 2: Splitting into chunks...');
      const chunkConfig = getOptimalChunkSize(documentType);
      console.log(
        `   Using chunk size: ${chunkConfig.chunkSize}, overlap: ${chunkConfig.chunkOverlap}`
      );

      const chunks = await splitDocuments(cleanedDocuments, chunkConfig);
      console.log(`✅ Created ${chunks.length} chunks`);

      // Step 2.5: Filter out invalid chunks
      console.log('\n⏳ Step 2.5: Validating chunks...');
      const minChunkLength = 50; // Minimum 50 characters for a valid chunk
      const validChunks = chunks.filter(chunk => {
        return isValidChunk(chunk.pageContent, minChunkLength);
      });

      const filteredCount = chunks.length - validChunks.length;
      if (filteredCount > 0) {
        console.log(`⚠️  Filtered out ${filteredCount} invalid chunks`);
      }
      console.log(`✅ ${validChunks.length} valid chunks remaining`);

      if (validChunks.length === 0) {
        throw new Error(
          'No valid chunks after filtering. Content may be too repetitive, too short, or malformed.'
        );
      }

      // Step 3: Enhance metadata
      console.log('\n⏳ Step 3: Adding metadata to chunks...');
      const filepath =
        documentType === 'huggingface' ? `hf://${sourceName}` : sourceName;

      const enhancedChunks = enhanceChunkMetadata(
        validChunks,
        documentId,
        sourceName,
        filepath
      );
      console.log(`✅ Metadata added to all chunks`);

      // Step 4: Generate embeddings and store in vector database
      let vectorIds: string[] = [];
      if (storeInVectorDB) {
        console.log(
          `\n⏳ Step 4: Generating embeddings and storing in ChromaDB...`
        );
        console.log(`   Collection: ${collectionName || 'default'}`);

        const vectorResult = await vectorStoreService.addDocuments(
          enhancedChunks,
          collectionName
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
      console.log(`   Valid chunks: ${validChunks.length}`);
      console.log(`   Filtered: ${filteredCount}`);
      console.log(`   Avg chunk size: ${stats.avgChunkSize} chars`);
      console.log(
        `   Min/Max: ${stats.minChunkSize}/${stats.maxChunkSize} chars`
      );
      console.log(`   Total characters: ${stats.totalCharacters}`);
      console.log(`   Processing time: ${processingTime}ms`);
      if (storeInVectorDB) {
        console.log(`   Vectors stored: ${vectorIds.length}`);
        console.log(`   Collection: ${collectionName || 'default'}`);
      }

      console.log('\n✅ Document processing completed successfully!\n');

      const message =
        filteredCount > 0
          ? `Processed ${enhancedChunks.length} chunks from ${sourceName} (filtered ${filteredCount} invalid chunks)`
          : `Processed ${enhancedChunks.length} chunks from ${sourceName}`;

      return {
        success: true,
        documentId,
        chunksCreated: enhancedChunks.length,
        chunks: enhancedChunks,
        stats: processingStats,
        vectorIds,
        message,
      };
    } catch (error) {
      console.error('❌ Error processing documents:', error);
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
      'huggingface/dataset': 'huggingface',
      'text/csv': 'csv',
      'application/csv': 'csv',
    };
    return typeMap[mimeType] || 'default';
  }

  // Helper method to validate documents before processing
  validateDocuments(documents: Document[]): {
    valid: boolean;
    totalDocuments: number;
    emptyDocuments: number;
    validDocuments: number;
  } {
    const emptyDocuments = documents.filter(
      doc => !doc.pageContent || doc.pageContent.trim().length === 0
    ).length;

    return {
      valid: emptyDocuments === 0,
      totalDocuments: documents.length,
      emptyDocuments,
      validDocuments: documents.length - emptyDocuments,
    };
  }

  // Helper method to get processing summary
  getProcessingSummary(result: ProcessingResult): string {
    if (!result.success) {
      return `Processing failed: ${result.error || 'Unknown error'}`;
    }

    const lines = [
      `✅ Successfully processed ${result.chunksCreated} chunks`,
      `📊 Statistics:`,
      `   - Avg chunk size: ${result.stats.avgChunkSize} chars`,
      `   - Total characters: ${result.stats.totalCharacters}`,
      `   - Processing time: ${result.stats.processingTime}ms`,
    ];

    if (result.vectorIds && result.vectorIds.length > 0) {
      lines.push(`   - Vectors stored: ${result.vectorIds.length}`);
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();
