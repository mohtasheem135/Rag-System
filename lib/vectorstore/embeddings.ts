// lib/vectorstore/embeddings.ts

import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';

export class EmbeddingService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private readonly modelName = 'models/gemini-embedding-001';

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: this.modelName,
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    });

    console.log(`✅ Gemini embeddings initialized: ${this.modelName}`);
  }

  getEmbeddings(): GoogleGenerativeAIEmbeddings {
    return this.embeddings;
  }

  // Generate embedding for a single text (useful for queries)
  async embedQuery(text: string): Promise<number[]> {
    try {
      console.log(`🔄 Generating query embedding (${text.length} chars)...`);

      // Validate text
      if (!text || text.trim().length === 0) {
        throw new Error('Query text cannot be empty');
      }

      const embedding = await this.embeddings.embedQuery(text);
      console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      console.error('❌ Error generating query embedding:', error);
      throw new Error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Generate embeddings for multiple documents
  async embedDocuments(texts: string[]): Promise<number[][]> {
    try {
      console.log(`🔄 Generating embeddings for ${texts.length} documents...`);

      // Validate texts
      if (!texts || texts.length === 0) {
        throw new Error('No texts provided for embedding');
      }

      // Debug: Check first text
      if (texts.length > 0) {
        const firstText = texts[0];
        console.log(`   First text length: ${firstText.length} chars`);
        console.log(
          `   First text preview: ${firstText.substring(0, 100).replace(/\n/g, ' ')}...`
        );

        // Validate minimum length
        if (firstText.trim().length < 10) {
          throw new Error(
            `Text is too short (${firstText.length} chars). Minimum 10 characters required.`
          );
        }
      }

      // Validate all texts before sending
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (!text || text.trim().length < 10) {
          throw new Error(
            `Text at index ${i} is too short (${text?.length || 0} chars). Minimum 10 characters required.`
          );
        }
      }

      const embeddings = await this.embeddings.embedDocuments(texts);

      // Validate embeddings
      if (!embeddings || embeddings.length === 0) {
        throw new Error('No embeddings returned from API');
      }

      if (embeddings.length !== texts.length) {
        throw new Error(
          `Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`
        );
      }

      if (embeddings[0].length === 0) {
        throw new Error('Empty embedding returned from API');
      }

      console.log(`✅ Generated ${embeddings.length} embeddings`);
      console.log(`   Embedding dimension: ${embeddings[0].length}`);

      return embeddings;
    } catch (error) {
      console.error('❌ Error generating document embeddings:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(
        `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Batch process large document sets with fault tolerance
  async embedDocumentsBatch(
    texts: string[],
    batchSize: number = 10
  ): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      throw new Error('No texts provided for batch embedding');
    }

    const allEmbeddings: (number[] | null)[] = new Array(texts.length).fill(
      null
    );
    const failedIndices: number[] = [];
    const totalBatches = Math.ceil(texts.length / batchSize);

    console.log(
      `📦 Processing ${texts.length} documents in ${totalBatches} batches (${batchSize} per batch)`
    );

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
      const batchNum = Math.floor(i / batchSize) + 1;

      console.log(`   Batch ${batchNum}/${totalBatches}...`);

      try {
        const batchEmbeddings = await this.embedDocuments(batch);

        // Store successful embeddings
        for (let j = 0; j < batchEmbeddings.length; j++) {
          allEmbeddings[i + j] = batchEmbeddings[j];
        }

        console.log(`   ✅ Batch ${batchNum} completed`);

        // Rate limiting delay between batches
        if (i + batchSize < texts.length) {
          console.log(`   ⏳ Waiting 1s before next batch...`);
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`❌ Error in batch ${batchNum}:`, error);

        // Mark all items in this batch as failed
        for (let j = 0; j < batch.length; j++) {
          const globalIndex = i + j;
          failedIndices.push(globalIndex);
          console.warn(
            `   ⚠️  Skipping document ${globalIndex} due to batch failure`
          );
        }

        // Continue with next batch instead of failing completely
        console.log(`   ⏭️  Continuing with next batch...`);

        // Add delay even after error
        if (i + batchSize < texts.length) {
          await this.delay(1500); // Slightly longer delay after error
        }
      }
    }

    // Filter out failed embeddings
    const successfulEmbeddings = allEmbeddings.filter(
      (emb): emb is number[] => emb !== null
    );

    console.log(`\n📊 Embedding Summary:`);
    console.log(`   ✅ Successful: ${successfulEmbeddings.length}`);
    console.log(`   ❌ Failed: ${failedIndices.length}`);

    if (failedIndices.length > 0) {
      console.log(`   Failed indices: [${failedIndices.join(', ')}]`);
    }

    if (successfulEmbeddings.length === 0) {
      throw new Error(
        'All embeddings failed. Please check your input texts and API key.'
      );
    }

    // Warn if significant portion failed
    const failureRate = failedIndices.length / texts.length;
    if (failureRate > 0.1) {
      console.warn(
        `⚠️  Warning: ${(failureRate * 100).toFixed(1)}% of embeddings failed`
      );
    }

    return successfulEmbeddings;
  }

  // Enhanced batch processing that returns both embeddings and metadata about failures
  async embedDocumentsBatchWithMetadata(
    texts: string[],
    batchSize: number = 10
  ): Promise<{
    embeddings: number[][];
    failedIndices: number[];
    successRate: number;
  }> {
    const embeddings = await this.embedDocumentsBatch(texts, batchSize);
    const successCount = embeddings.length;
    const failedCount = texts.length - successCount;
    const failedIndices: number[] = [];

    // Calculate which indices failed
    let embeddingIndex = 0;
    for (let i = 0; i < texts.length; i++) {
      if (embeddingIndex < embeddings.length) {
        embeddingIndex++;
      } else {
        failedIndices.push(i);
      }
    }

    return {
      embeddings,
      failedIndices,
      successRate: successCount / texts.length,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get embedding dimensions (Gemini embedding-001 is 768 dimensions)
  getEmbeddingDimension(): number {
    return 768;
  }

  // Validate if a text is suitable for embedding
  validateText(
    text: string,
    minLength: number = 10
  ): {
    valid: boolean;
    reason?: string;
  } {
    if (!text) {
      return { valid: false, reason: 'Text is null or undefined' };
    }

    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return { valid: false, reason: 'Text is empty after trimming' };
    }

    if (trimmedText.length < minLength) {
      return {
        valid: false,
        reason: `Text is too short (${trimmedText.length} chars, minimum ${minLength})`,
      };
    }

    return { valid: true };
  }

  // Get model information
  getModelInfo(): {
    modelName: string;
    dimension: number;
    taskType: string;
  } {
    return {
      modelName: this.modelName,
      dimension: this.getEmbeddingDimension(),
      taskType: 'RETRIEVAL_DOCUMENT',
    };
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
