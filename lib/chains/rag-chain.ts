import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { geminiLLMService } from '../llm/gemini';
import { vectorStoreService } from '../vectorstore/chromadb';
import { ragPromptTemplate } from './prompts';
import { chatHistoryManager } from '../memory/chat-history';
import type { Document } from '@langchain/core/documents';

export class RAGChainService {
  // Simple RAG chain without history
  async queryDocuments(
    question: string,
    collectionName?: string,
    k: number = 4
  ): Promise<{ answer: string; sources: Document[] }> {
    try {
      console.log(`\n🔍 RAG Query: "${question}"`);
      console.log(`   Collection: ${collectionName || 'default'}`);
      console.log(`   Retrieving top ${k} documents...`);

      // Step 1: Retrieve relevant documents
      const retrievedDocs = await vectorStoreService.similaritySearchWithScore(
        question,
        k,
        collectionName
      );

      console.log(`✅ Retrieved ${retrievedDocs.length} relevant documents`);

      // Step 2: Format context from retrieved documents
      const context = retrievedDocs
        .map(([doc, score], idx) => {
          const source =
            doc.metadata.original_filename || doc.metadata.source || 'unknown';
          const page = doc.metadata.page_number
            ? ` (Page ${doc.metadata.page_number})`
            : '';
          return `[Source ${idx + 1}: ${source}${page}]\n${doc.pageContent}`;
        })
        .join('\n\n---\n\n');

      console.log(`📄 Context prepared (${context.length} characters)`);

      // Step 3: Create prompt
      const prompt = await ragPromptTemplate.format({
        context,
        chat_history: 'No previous conversation.',
        question,
      });

      console.log(`💬 Generating answer with Gemini...`);

      // Step 4: Get answer from LLM
      const llm = geminiLLMService.getLLM();
      const response = await llm.invoke(prompt);
      const answer = response.content.toString();

      console.log(`✅ Answer generated (${answer.length} characters)`);

      // Extract documents without scores for return
      const sources = retrievedDocs.map(([doc]) => doc);

      return { answer, sources };
    } catch (error) {
      console.error('❌ Error in RAG chain:', error);
      throw error;
    }
  }

  // RAG chain WITH chat history
  async queryWithHistory(
    sessionId: string,
    question: string,
    collectionName?: string,
    k: number = 4
  ): Promise<{ answer: string; sources: Document[]; messageId: string }> {
    try {
      console.log(`\n🔍 RAG Query with History`);
      console.log(`   Session: ${sessionId}`);
      console.log(`   Question: "${question}"`);

      // Step 1: Add user message to history
      const userMessage = chatHistoryManager.addMessage(
        sessionId,
        'user',
        question
      );

      // Step 2: Get formatted chat history
      const chatHistory = chatHistoryManager.getFormattedHistory(sessionId, 10);
      console.log(
        `📜 Chat history: ${chatHistory.split('\n').length} messages`
      );

      // Step 3: Retrieve relevant documents
      const retrievedDocs = await vectorStoreService.similaritySearchWithScore(
        question,
        k,
        collectionName
      );

      console.log(`✅ Retrieved ${retrievedDocs.length} documents`);

      // Step 4: Format context
      const context = retrievedDocs
        .map(([doc, score], idx) => {
          const source =
            doc.metadata.original_filename || doc.metadata.source || 'unknown';
          const page = doc.metadata.page_number
            ? ` (Page ${doc.metadata.page_number})`
            : '';
          return `[Source ${idx + 1}: ${source}${page} - Relevance: ${(1 - score).toFixed(2)}]\n${doc.pageContent}`;
        })
        .join('\n\n---\n\n');

      // Step 5: Create prompt with history
      const prompt = await ragPromptTemplate.format({
        context,
        chat_history: chatHistory,
        question,
      });

      console.log(`💬 Generating contextual answer...`);

      // Step 6: Get answer from LLM
      const llm = geminiLLMService.getLLM();
      const response = await llm.invoke(prompt);
      const answer = response.content.toString();

      console.log(`✅ Answer generated`);

      // Step 7: Add assistant message to history
      const sources = retrievedDocs.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score,
      }));

      const assistantMessage = chatHistoryManager.addMessage(
        sessionId,
        'assistant',
        answer,
        sources
      );

      return {
        answer,
        sources: retrievedDocs.map(([doc]) => doc),
        messageId: assistantMessage.id,
      };
    } catch (error) {
      console.error('❌ Error in RAG chain with history:', error);
      throw error;
    }
  }

  // Stream response for better UX
  async *streamQueryWithHistory(
    sessionId: string,
    question: string,
    collectionName?: string,
    k: number = 4
  ): AsyncGenerator<{ type: 'sources' | 'token' | 'complete'; data: any }> {
    try {
      // Step 1: Add user message
      chatHistoryManager.addMessage(sessionId, 'user', question);

      // Step 2: Get history and retrieve documents
      const chatHistory = chatHistoryManager.getFormattedHistory(sessionId, 10);
      const retrievedDocs = await vectorStoreService.similaritySearchWithScore(
        question,
        k,
        collectionName
      );

      // Yield sources first
      yield {
        type: 'sources',
        data: retrievedDocs.map(([doc, score]) => ({
          content: doc.pageContent.substring(0, 200) + '...',
          metadata: doc.metadata,
          score,
        })),
      };

      // Step 3: Format context and create prompt
      const context = retrievedDocs
        .map(([doc, score], idx) => `[Source ${idx + 1}]\n${doc.pageContent}`)
        .join('\n\n---\n\n');

      const prompt = await ragPromptTemplate.format({
        context,
        chat_history: chatHistory,
        question,
      });

      // Step 4: Stream tokens
      const llm = geminiLLMService.getLLM();
      const stream = await llm.stream(prompt);

      let fullAnswer = '';
      for await (const chunk of stream) {
        const token = chunk.content.toString();
        fullAnswer += token;
        yield { type: 'token', data: token };
      }

      // Step 5: Add assistant message to history
      const sources = retrievedDocs.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score,
      }));

      chatHistoryManager.addMessage(
        sessionId,
        'assistant',
        fullAnswer,
        sources
      );

      // Complete
      yield { type: 'complete', data: { answer: fullAnswer } };
    } catch (error) {
      console.error('❌ Error in streaming RAG chain:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const ragChainService = new RAGChainService();
