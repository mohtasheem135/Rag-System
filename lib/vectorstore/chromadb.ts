// lib/vectorstore/chromadb.ts

import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient } from 'chromadb';
import type { Document } from '@langchain/core/documents';
import { embeddingService } from './embeddings';

export class VectorStoreService {
  private client: ChromaClient;
  private readonly defaultCollection: string = 'rag_documents';
  private readonly chromaUrl: string;
  private vectorStores: Map<string, Chroma> = new Map();

  constructor() {
    // ChromaDB server URL (default: http://localhost:8000)
    this.chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';

    // Initialize ChromaDB client
    this.client = new ChromaClient({
      path: this.chromaUrl,
    });

    console.log(`✅ ChromaDB initialized at: ${this.chromaUrl}`);
  }

  // Get or create a vector store for a specific collection
  async getOrCreateCollection(collectionName?: string): Promise<Chroma> {
    const name = collectionName || this.defaultCollection;

    // Check if we already have this vector store in memory
    if (this.vectorStores.has(name)) {
      console.log(`♻️  Using cached vector store: ${name}`);
      return this.vectorStores.get(name)!;
    }

    try {
      // Try to get existing collection
      const vectorStore = await Chroma.fromExistingCollection(
        embeddingService.getEmbeddings(),
        {
          collectionName: name,
          url: this.chromaUrl,
        }
      );

      this.vectorStores.set(name, vectorStore);
      console.log(`✅ Using existing collection: ${name}`);
      return vectorStore;
    } catch (error) {
      // Collection doesn't exist, create new one
      console.log(`📝 Creating new collection: ${name}`);
      const vectorStore = new Chroma(embeddingService.getEmbeddings(), {
        collectionName: name,
        url: this.chromaUrl,
      });

      this.vectorStores.set(name, vectorStore);
      return vectorStore;
    }
  }

  // List all collections with their document counts
  async listCollections(): Promise<{ name: string; count: number }[]> {
    try {
      console.log('📋 Listing all collections...');
      const collections = await this.client.listCollections();

      const collectionInfo = await Promise.all(
        collections.map(async col => {
          try {
            const count = await col.count();
            return {
              name: col.name,
              count,
            };
          } catch (error) {
            console.error(
              `Error getting count for collection ${col.name}:`,
              error
            );
            return {
              name: col.name,
              count: 0,
            };
          }
        })
      );

      console.log(`✅ Found ${collectionInfo.length} collections`);
      return collectionInfo;
    } catch (error) {
      console.error('❌ Error listing collections:', error);
      return [];
    }
  }

  // Add documents to a specific collection with fault tolerance
  async addDocuments(
    documents: Document[],
    collectionName?: string
  ): Promise<{
    success: boolean;
    vectorIds: string[];
    error?: string;
    skippedCount?: number;
  }> {
    const startTime = Date.now();

    try {
      const name = collectionName || this.defaultCollection;
      console.log(
        `\n📊 Adding ${documents.length} documents to vector store...`
      );
      console.log(`   Collection: ${name}`);

      // Step 1: Get or create collection
      const chromaCollection = await this.client.getOrCreateCollection({
        name,
        metadata: { 'hnsw:space': 'cosine' },
      });

      // Step 2: Extract texts from documents
      const texts = documents.map(doc => doc.pageContent);
      console.log(`   Extracted ${texts.length} text chunks`);

      // Step 3: Generate embeddings with batch processing and error handling
      console.log(`   Generating embeddings with batch processing...`);
      const embeddingResult =
        await embeddingService.embedDocumentsBatchWithMetadata(texts, 10);

      const { embeddings, failedIndices } = embeddingResult;

      console.log(`   Generated ${embeddings.length} embeddings`);
      console.log(`   Embedding dimension: ${embeddings[0]?.length || 0}`);

      // Step 4: Filter out documents that failed embedding
      const successfulDocuments = documents.filter(
        (_, idx) => !failedIndices.includes(idx)
      );

      if (successfulDocuments.length === 0) {
        throw new Error('No documents successfully embedded');
      }

      if (failedIndices.length > 0) {
        console.warn(
          `   ⚠️  ${failedIndices.length} documents failed embedding and will be skipped`
        );
      }

      console.log(
        `\n   Preparing ${successfulDocuments.length} documents for ChromaDB...`
      );

      // Step 5: Sanitize metadata - only keep primitive values
      const metadatas = successfulDocuments.map(doc => {
        const sanitized: Record<string, string | number | boolean> = {};

        for (const [key, value] of Object.entries(doc.metadata)) {
          // Skip complex objects and arrays
          if (value === null || value === undefined) {
            continue;
          }

          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean'
          ) {
            sanitized[key] = value;
          } else if (typeof value === 'object') {
            // Convert objects/arrays to JSON strings
            sanitized[key] = JSON.stringify(value);
          }
        }

        return sanitized;
      });

      // Step 6: Generate IDs
      const ids = successfulDocuments.map(
        (doc, idx) => doc.metadata.chunk_id || `${name}_${Date.now()}_${idx}`
      );

      // Step 7: Extract successful texts
      const successfulTexts = successfulDocuments.map(doc => doc.pageContent);

      // Step 8: Add to ChromaDB
      console.log(`   Adding to ChromaDB collection...`);
      await chromaCollection.add({
        ids,
        embeddings,
        metadatas,
        documents: successfulTexts,
      });

      const duration = Date.now() - startTime;

      console.log(
        `✅ Successfully added ${successfulDocuments.length} vectors to ChromaDB`
      );
      console.log(`   Collection: ${name}`);
      console.log(`   Time taken: ${duration}ms`);
      console.log(
        `   Avg time per document: ${Math.round(
          duration / successfulDocuments.length
        )}ms`
      );

      if (failedIndices.length > 0) {
        console.warn(
          `   ⚠️  Skipped ${failedIndices.length} documents due to embedding failures`
        );
        console.warn(`   Failed indices: [${failedIndices.join(', ')}]`);
      }

      // Clear cached vector store to force refresh
      this.vectorStores.delete(name);

      return {
        success: true,
        vectorIds: ids,
        skippedCount: failedIndices.length,
      };
    } catch (error) {
      console.error('❌ Error adding documents to vector store:', error);
      console.error('Error details:', error);
      return {
        success: false,
        vectorIds: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Similarity search
  async similaritySearch(
    query: string,
    k: number = 4,
    collectionName?: string,
    filter?: Record<string, any>
  ): Promise<Document[]> {
    try {
      const vectorStore = await this.getOrCreateCollection(collectionName);

      console.log(`\n🔍 Performing similarity search...`);
      console.log(`   Query: "${query.substring(0, 50)}..."`);
      console.log(`   Collection: ${collectionName || this.defaultCollection}`);
      console.log(`   Top K: ${k}`);

      const results = await vectorStore.similaritySearch(query, k, filter);

      console.log(`✅ Found ${results.length} similar documents`);

      return results;
    } catch (error) {
      console.error('❌ Error in similarity search:', error);
      throw error;
    }
  }

  // Similarity search with scores
  async similaritySearchWithScore(
    query: string,
    k: number = 4,
    collectionName?: string,
    filter?: Record<string, any>
  ): Promise<[Document, number][]> {
    try {
      const vectorStore = await this.getOrCreateCollection(collectionName);

      console.log(`\n🔍 Performing similarity search with scores...`);
      console.log(`   Collection: ${collectionName || this.defaultCollection}`);

      const results = await vectorStore.similaritySearchWithScore(
        query,
        k,
        filter
      );

      console.log(`✅ Found ${results.length} similar documents with scores`);
      results.forEach(([doc, score], idx) => {
        const source =
          doc.metadata.original_filename || doc.metadata.source || 'unknown';
        console.log(
          `   ${idx + 1}. Score: ${score.toFixed(4)} | Source: ${source}`
        );
      });

      return results;
    } catch (error) {
      console.error('❌ Error in similarity search with score:', error);
      return [];
    }
  }

  // Get retriever for RAG chain
  async getRetriever(k: number = 4, collectionName?: string) {
    const vectorStore = await this.getOrCreateCollection(collectionName);
    return vectorStore.asRetriever({
      k,
      searchType: 'similarity',
    });
  }

  // Delete documents by filter
  async deleteDocuments(
    filter: Record<string, any>,
    collectionName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const vectorStore = await this.getOrCreateCollection(collectionName);

      await vectorStore.delete({ filter });

      console.log(`✅ Deleted documents matching filter:`, filter);

      // Clear cached vector store to force refresh
      const name = collectionName || this.defaultCollection;
      this.vectorStores.delete(name);

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting documents:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get collection stats
  async getCollectionStats(collectionName?: string): Promise<{
    name: string;
    count: number;
  }> {
    try {
      const name = collectionName || this.defaultCollection;
      const collection = await this.client.getCollection({ name });
      const count = await collection.count();

      return {
        name,
        count,
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return {
        name: collectionName || this.defaultCollection,
        count: 0,
      };
    }
  }

  // Delete entire collection
  async deleteCollection(collectionName?: string): Promise<boolean> {
    try {
      const name = collectionName || this.defaultCollection;
      await this.client.deleteCollection({ name });

      // Clear cached vector store
      this.vectorStores.delete(name);

      console.log(`✅ Deleted collection: ${name}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting collection:', error);
      return false;
    }
  }

  // Check if collection exists
  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      await this.client.getCollection({ name: collectionName });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Clear the vector store cache (useful after bulk operations)
  clearCache(collectionName?: string): void {
    if (collectionName) {
      this.vectorStores.delete(collectionName);
      console.log(`🗑️  Cleared cache for collection: ${collectionName}`);
    } else {
      this.vectorStores.clear();
      console.log(`🗑️  Cleared all vector store cache`);
    }
  }

  // Get detailed stats about a collection
  async getCollectionDetails(collectionName?: string): Promise<{
    name: string;
    count: number;
    exists: boolean;
  }> {
    const name = collectionName || this.defaultCollection;
    try {
      const stats = await this.getCollectionStats(name);
      return {
        ...stats,
        exists: true,
      };
    } catch (error) {
      return {
        name,
        count: 0,
        exists: false,
      };
    }
  }

  /**
   * Create a new empty collection
   */
  async createCollection(name: string): Promise<void> {
    try {
      console.log(`📦 Creating collection: ${name}`);

      // Check if collection already exists
      const exists = await this.collectionExists(name);

      if (exists) {
        throw new Error(`Collection "${name}" already exists`);
      }

      // Create the collection using ChromaDB client
      await this.client.createCollection({
        name,
        metadata: {
          'hnsw:space': 'cosine',
          created_at: new Date().toISOString(),
        },
      });

      console.log(`✅ Collection "${name}" created successfully`);
    } catch (error) {
      console.error('❌ Error creating collection:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorStoreService = new VectorStoreService();
