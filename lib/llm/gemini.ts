// lib/llm/gemini.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export class GeminiLLMService {
  private llm: ChatGoogleGenerativeAI;
  private readonly modelName = 'gemini-3-flash-preview';

  constructor(temperature: number = 0.3) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    this.llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: this.modelName,
      temperature, // 0.3 for factual responses, 0.7 for creative
      maxOutputTokens: 2048,
      topK: 40,
      topP: 0.95,
    });

    console.log(`✅ Gemini LLM initialized: ${this.modelName}`);
  }

  getLLM(): ChatGoogleGenerativeAI {
    return this.llm;
  }

  // Stream response for better UX
  async streamResponse(prompt: string): Promise<AsyncGenerator<string>> {
    const stream = await this.llm.stream(prompt);

    async function* generateChunks() {
      for await (const chunk of stream) {
        yield chunk.content.toString();
      }
    }

    return generateChunks();
  }

  // Invoke with full response
  async invoke(prompt: string): Promise<string> {
    const response = await this.llm.invoke(prompt);
    return response.content.toString();
  }
}

// Export singleton instance
export const geminiLLMService = new GeminiLLMService();
