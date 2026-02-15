export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
}

export interface SourceDocument {
  content: string;
  metadata: {
    source: string;
    page_number?: number;
    chunk_index?: number;
    original_filename?: string;
  };
  score?: number;
}

export interface ChatSession {
  id: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  collectionName?: string;
}

export interface ChatRequest {
  sessionId: string;
  question: string;
  collectionName?: string;
  k?: number; // Number of documents to retrieve
}

export interface ChatResponse {
  answer: string;
  sources: SourceDocument[];
  sessionId: string;
  messageId: string;
}
