'use client';

import { useState } from 'react';
import { Search, Database, FileText, Hash, Loader2 } from 'lucide-react';

export default function TestSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/vectorstore/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k: 4 }),
      });

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/vectorstore/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-indigo-purple-fuchsia bg-clip-text text-transparent">
              Vector Search
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Search through your document embeddings
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={loadStats}
              className="px-6 py-3 gradient-indigo-purple-fuchsia text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center gap-2 font-medium"
            >
              <Database className="w-5 h-5" />
              Load Collection Stats
            </button>
            {stats && (
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Collection:</span>
                  <span className="text-white font-medium">{stats.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-400">Documents:</span>
                  <span className="text-white font-medium">{stats.count}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter search query..."
                className="w-full pl-12 pr-4 py-4 bg-black/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder-gray-500 transition-all"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-4 gradient-indigo-purple-fuchsia text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 flex items-center gap-2 font-medium transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-500" />
              Results
              <span className="text-lg text-gray-500">({results.length})</span>
            </h2>
            {results.map((result, idx) => (
              <div
                key={idx}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 rounded-full text-sm font-medium border border-purple-500/30">
                    Score: {result.score.toFixed(4)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Chunk {result.metadata.chunk_index + 1} of{' '}
                    {result.metadata.total_chunks}
                  </span>
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {result.content}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{result.metadata.original_filename}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span>
                      ID: {result.metadata.document_id.slice(0, 8)}...
                    </span>
                  </div>
                  {result.metadata.page_number && (
                    <div className="flex items-center gap-1">
                      <span>Page: {result.metadata.page_number}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
