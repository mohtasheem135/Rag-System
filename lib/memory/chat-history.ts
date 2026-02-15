import { ChatMessage, ChatSession } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

export class ChatHistoryManager {
  private sessions: Map<string, ChatSession> = new Map();

  // Create new session
  createSession(collectionName?: string): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      collectionName,
    };

    this.sessions.set(session.id, session);
    console.log(`✅ Created new chat session: ${session.id}`);

    return session;
  }

  // Get session by ID
  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Add message to session
  addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    sources?: any[]
  ): ChatMessage {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const message: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      sources,
    };

    session.messages.push(message);
    session.updatedAt = new Date();

    console.log(`📝 Added ${role} message to session ${sessionId}`);

    return message;
  }

  // Get formatted chat history for prompt
  getFormattedHistory(sessionId: string, maxMessages: number = 10): string {
    const session = this.sessions.get(sessionId);

    if (!session || session.messages.length === 0) {
      return 'No previous conversation.';
    }

    // Get last N messages
    const recentMessages = session.messages.slice(-maxMessages);

    // Format as conversation
    return recentMessages
      .map(
        msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      )
      .join('\n');
  }

  // Get chat history as array (for LangChain)
  getChatHistory(
    sessionId: string,
    maxMessages: number = 10
  ): Array<[string, string]> {
    const session = this.sessions.get(sessionId);

    if (!session || session.messages.length === 0) {
      return [];
    }

    // Get last N messages in pairs
    const recentMessages = session.messages.slice(-maxMessages);
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < recentMessages.length - 1; i += 2) {
      if (
        recentMessages[i].role === 'user' &&
        recentMessages[i + 1]?.role === 'assistant'
      ) {
        pairs.push([recentMessages[i].content, recentMessages[i + 1].content]);
      }
    }

    return pairs;
  }

  // Clear old sessions (optional cleanup)
  clearOldSessions(maxAgeHours: number = 24): void {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.updatedAt.getTime() > maxAge) {
        this.sessions.delete(sessionId);
        console.log(`🗑️ Deleted old session: ${sessionId}`);
      }
    }
  }

  // Get all sessions (for debugging)
  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  // Delete session
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

// Export singleton instance
export const chatHistoryManager = new ChatHistoryManager();
