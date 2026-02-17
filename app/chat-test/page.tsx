'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Loader2,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface Collection {
  name: string;
  count: number;
}

export default function ChatTestPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<{
    [key: number]: boolean;
  }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Collection management state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  // Create session when collection is selected
  useEffect(() => {
    if (selectedCollection) {
      createSession();
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const response = await fetch('/api/vectorstore/collections');
      const result = await response.json();

      if (result.success && result.data) {
        setCollections(result.data);
        if (result.data.length > 0 && !selectedCollection) {
          setSelectedCollection(result.data[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const createSession = async () => {
    if (!selectedCollection) return;

    try {
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName: selectedCollection }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
        console.log('Session created:', data.data.sessionId);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleCollectionChange = (newCollection: string) => {
    setSelectedCollection(newCollection);
    // Reset session and messages when collection changes
    setSessionId('');
    setMessages([]);
  };

  const toggleSources = (messageIndex: number) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResponse = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple Markdown renderer (handles **bold**, *italic*, lists, etc.)
  const renderMarkdown = (text: string) => {
    return (
      text
        // Bold **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic *text*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headers
        .replace(
          /^### (.*$)/gm,
          '<h4 class="font-bold text-lg mt-2 mb-1">$1</h4>'
        )
        .replace(
          /^## (.*$)/gm,
          '<h3 class="font-bold text-xl mt-3 mb-2">$1</h3>'
        )
        .replace(
          /^# (.*$)/gm,
          '<h2 class="font-bold text-2xl mt-4 mb-3">$1</h2>'
        )
        // Bullet points
        .replace(
          /^\s*[-]\s+(.*$)/gm,
          '<div class="flex items-start gap-2 mt-1"><span class="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span><span>$1</span></div>'
        )
        // Line breaks
        .replace(/\n/g, '<br>')
        // Numbered lists
        .replace(
          /^\s*\d+\.\s+(.*$)/gm,
          '<div class="flex items-start gap-2 mt-1"><span class="w-5 text-sm font-mono text-gray-500 flex-shrink-0">$&nbsp;</span><span>$1</span></div>'
        )
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || !selectedCollection) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages(prev => [...prev, userMessage]);
    const question = input.trim();
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          question,
          collectionName: selectedCollection,
          k: 4,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.data.answer,
          sources: data.data.sources || [],
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-4 bg-gray-900/50 backdrop-blur-lg px-8 py-4 rounded-2xl border border-gray-800">
            <div className="w-12 h-12 gradient-indigo-purple-fuchsia rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold">
                <span className="gradient-indigo-purple-fuchsia bg-clip-text text-transparent">
                  RAG Assistant
                </span>
              </h1>
              <p className="text-sm text-gray-400">
                Session:{' '}
                {sessionId
                  ? `${sessionId.substring(0, 8)}...`
                  : 'Connecting...'}
              </p>
            </div>
          </div>
        </div>

        {/* Collection Selector */}
        <div className="mb-6 bg-gray-900/30 border border-gray-800 rounded-xl p-4 backdrop-blur-sm">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Collection
          </label>
          <div className="flex gap-2">
            <select
              value={selectedCollection}
              onChange={e => handleCollectionChange(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingCollections || loading}
            >
              {collections.length === 0 && (
                <option value="">
                  {loadingCollections
                    ? 'Loading...'
                    : 'No collections available'}
                </option>
              )}
              {collections.map(col => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.count} {col.count === 1 ? 'doc' : 'docs'})
                </option>
              ))}
            </select>

            <button
              onClick={fetchCollections}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loadingCollections}
              title="Refresh collections"
            >
              <RefreshCw
                className={`w-5 h-5 ${loadingCollections ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          {selectedCollection && (
            <p className="text-xs text-gray-500 mt-2">
              Chatting with:{' '}
              <span className="text-purple-400">{selectedCollection}</span>
            </p>
          )}
        </div>

        {/* Chat Container */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm h-[65vh] max-h-[700px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Empty State */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 gradient-indigo-purple-fuchsia rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Start Chatting
                  </h2>
                  <p className="text-gray-400">
                    {selectedCollection
                      ? `Ask questions about documents in "${selectedCollection}"`
                      : 'Select a collection to start chatting'}
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl p-5 ${
                      msg.role === 'user'
                        ? 'gradient-indigo-purple-fuchsia text-white'
                        : 'bg-gray-800/50 border border-gray-700'
                    }`}
                  >
                    {/* Message content with Markdown */}
                    <div
                      className="prose prose-sm max-w-none leading-relaxed text-gray-200"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.content),
                      }}
                    />

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-3 opacity-60 flex items-center gap-2 ${
                        msg.role === 'user'
                          ? 'justify-end text-white/80'
                          : 'justify-start text-gray-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>

                    {/* Sources - Collapsible */}
                    {msg.sources && msg.sources.length > 0 && (
                      <>
                        <div
                          className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700 cursor-pointer group p-2 rounded-xl transition-all"
                          onClick={() => toggleSources(idx)}
                        >
                          <div
                            className={`transition-transform ${expandedSources[idx] ? 'rotate-180' : ''}`}
                          >
                            {expandedSources[idx] ? (
                              <ChevronUp className="w-5 h-5 text-purple-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                          <div className="font-medium text-purple-400 group-hover:text-purple-300">
                            {msg.sources.length} source
                            {msg.sources.length > 1 ? 's' : ''}
                          </div>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            expandedSources[idx]
                              ? 'max-h-96 opacity-100 mt-4'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="grid md:grid-cols-2 gap-3 mt-3">
                            {msg.sources.map((source: any, i: number) => (
                              <div
                                key={i}
                                className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-white truncate mb-1">
                                      {source.metadata.original_filename ||
                                        source.metadata.filename ||
                                        'Document'}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                      Page{' '}
                                      {source.metadata.page_number || 'N/A'} •
                                      Chunk{' '}
                                      {source.metadata.chunk_index || i + 1}
                                    </div>
                                    <div className="text-xs leading-relaxed text-gray-400 line-clamp-3">
                                      {source.content}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Action buttons */}
                    {msg.role === 'assistant' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-all"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                        <button
                          onClick={() =>
                            downloadResponse(
                              msg.content,
                              `rag-response-${Date.now()}.txt`
                            )
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-xl text-sm font-medium transition-all border border-purple-500/30"
                          title="Download response"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && !loading) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    selectedCollection
                      ? 'Ask anything about your uploaded documents...'
                      : 'Select a collection to start chatting...'
                  }
                  disabled={loading || !sessionId || !selectedCollection}
                  className="w-full px-5 py-4 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={
                  loading || !input.trim() || !sessionId || !selectedCollection
                }
                className="px-6 py-4 gradient-indigo-purple-fuchsia text-white rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
