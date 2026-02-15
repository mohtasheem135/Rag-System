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
      modelName: this.modelName,
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

      // Debug: Check first text
      if (texts.length > 0) {
        console.log(`   First text length: ${texts[0].length} chars`);
        console.log(`   First text preview: ${texts[0].substring(0, 100)}...`);
      }

      const embeddings = await this.embeddings.embedDocuments(texts);

      // Validate embeddings
      if (!embeddings || embeddings.length === 0) {
        throw new Error('No embeddings returned from API');
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

  // Batch process large document sets to avoid rate limits
  async embedDocumentsBatch(
    texts: string[],
    batchSize: number = 10 // Reduced from 20 to avoid rate limits
  ): Promise<number[][]> {
    const batches: string[][] = [];

    // Split into batches
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    console.log(
      `📦 Processing ${texts.length} documents in ${batches.length} batches`
    );

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < batches.length; i++) {
      console.log(`   Batch ${i + 1}/${batches.length}...`);

      try {
        const batchEmbeddings = await this.embedDocuments(batches[i]);
        allEmbeddings.push(...batchEmbeddings);

        // Delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await this.delay(1000); // Increased to 1 second
        }
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error);
        throw error;
      }
    }

    return allEmbeddings;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get embedding dimensions (Gemini embedding-001 is 768 dimensions)
  getEmbeddingDimension(): number {
    return 768;
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
