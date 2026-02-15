import { PromptTemplate } from '@langchain/core/prompts';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// System prompt for RAG
export const RAG_SYSTEM_PROMPT = `You are a helpful AI assistant that answers questions based on the provided context from documents.

INSTRUCTIONS:
1. Answer questions ONLY using the information from the context provided
2. If the context doesn't contain enough information to answer, say "I don't have enough information in the provided documents to answer that question."
3. Be specific and cite relevant parts of the context when answering
4. If asked about something not in the context, politely explain you can only answer based on the uploaded documents
5. Keep answers clear, concise, and well-structured
6. If there are multiple relevant pieces of information, synthesize them coherently

Context from documents:
{context}

Chat History:
{chat_history}

User Question: {question}

Answer:`;

// Standalone question prompt (for chat history reformulation)
export const STANDALONE_QUESTION_PROMPT = `Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone question that captures all necessary context from the conversation.

Chat History:
{chat_history}

Follow-up Question: {question}

Standalone Question:`;

// Create prompt templates
export const ragPromptTemplate = PromptTemplate.fromTemplate(RAG_SYSTEM_PROMPT);

export const standaloneQuestionTemplate = PromptTemplate.fromTemplate(
  STANDALONE_QUESTION_PROMPT
);

// Chat prompt template (alternative approach)
export const chatPromptTemplate = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a helpful AI assistant that answers questions based on the provided context from documents.

Answer questions using ONLY the information from the context. If you don't have enough information, say so clearly.`,
  ],
  ['human', `Context: {context}`],
  ['human', 'Chat History: {chat_history}'],
  ['human', 'Question: {question}'],
]);
