import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 gradient-indigo-purple-fuchsia rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">RAG System</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/upload"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
            >
              Upload
            </Link>
            <Link
              href="/chat-test"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
            >
              Chat
            </Link>
            <Link
              href="/test-search"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
            >
              Search
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-gray-500 text-sm">
            Powered by Next.js, LangChain, Google Gemini & ChromaDB
          </p>
        </div>
      </div>
    </footer>
  );
}
