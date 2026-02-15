import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient } from 'chromadb';
import type { Document } from '@langchain/core/documents';
import { embeddingService } from './embeddings';

export class VectorStoreService {
  private client: ChromaClient;
  private readonly collectionName: string = 'rag_documents';
  private readonly chromaUrl: string;

  constructor() {
    // ChromaDB server URL (default: http://localhost:8000)
    this.chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';

    // Initialize ChromaDB client
    this.client = new ChromaClient({
      path: this.chromaUrl, // This is actually the server URL
    });

    console.log(`✅ ChromaDB initialized at: ${this.chromaUrl}`);
  }

  // Create or get existing collection
  async getOrCreateCollection(collectionName?: string): Promise<Chroma> {
    const name = collectionName || this.collectionName;

    try {
      const vectorStore = await Chroma.fromExistingCollection(
        embeddingService.getEmbeddings(),
        {
          collectionName: name,
          url: this.chromaUrl,
        }
      );

      console.log(`✅ Using existing collection: ${name}`);
      return vectorStore;
    } catch (error) {
      console.log(`📝 Creating new collection: ${name}`);

      const vectorStore = new Chroma(embeddingService.getEmbeddings(), {
        collectionName: name,
        url: this.chromaUrl,
      });

      return vectorStore;
    }
  }

  // Add documents to vector store
  async addDocuments(
    documents: Document[],
    collectionName?: string
  ): Promise<{ success: boolean; vectorIds: string[]; error?: string }> {
    try {
      console.log(
        `\n📊 Adding ${documents.length} documents to vector store...`
      );

      const startTime = Date.now();

      // Step 1: Extract texts from documents
      const texts = documents.map(doc => doc.pageContent);
      console.log(`   Extracted ${texts.length} text chunks`);

      // Step 2: Generate embeddings manually with batch processing
      console.log(`   Generating embeddings with batch processing...`);
      const embeddings = await embeddingService.embedDocumentsBatch(texts, 10);

      console.log(`   Generated ${embeddings.length} embeddings`);
      console.log(`   Embedding dimension: ${embeddings[0]?.length || 0}`);

      // Step 3: Create collection and add documents with embeddings
      const name = collectionName || this.collectionName;
      const collection = await this.client.getOrCreateCollection({
        name,
      });

      console.log(`   Using collection: ${name}`);

      // Step 4: Prepare data for ChromaDB with sanitized metadata
      const ids = documents.map(
        (doc, idx) => doc.metadata.chunk_id || `chunk_${idx}`
      );

      // Sanitize metadata - only keep primitive values
      const metadatas = documents.map(doc => {
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

      // Step 5: Add to ChromaDB
      console.log(`   Adding to ChromaDB...`);
      await collection.add({
        ids,
        embeddings,
        metadatas,
        documents: texts,
      });

      const duration = Date.now() - startTime;

      console.log(
        `✅ Successfully added ${documents.length} vectors to ChromaDB`
      );
      console.log(`   Collection: ${name}`);
      console.log(`   Time taken: ${duration}ms`);
      console.log(
        `   Avg time per document: ${Math.round(duration / documents.length)}ms`
      );

      return {
        success: true,
        vectorIds: ids,
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

      const results = await vectorStore.similaritySearchWithScore(
        query,
        k,
        filter
      );

      console.log(`✅ Found ${results.length} similar documents with scores`);
      results.forEach(([doc, score], idx) => {
        console.log(
          `   ${idx + 1}. Score: ${score.toFixed(4)} | Source: ${doc.metadata.source}`
        );
      });

      return results;
    } catch (error) {
      console.error('❌ Error in similarity search with score:', error);
      throw error;
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
      const name = collectionName || this.collectionName;
      const collection = await this.client.getCollection({ name });
      const count = await collection.count();

      return {
        name,
        count,
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      return {
        name: collectionName || this.collectionName,
        count: 0,
      };
    }
  }

  // Delete entire collection
  async deleteCollection(collectionName?: string): Promise<void> {
    try {
      const name = collectionName || this.collectionName;
      await this.client.deleteCollection({ name });
      console.log(`✅ Deleted collection: ${name}`);
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorStoreService = new VectorStoreService();
