'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 gradient-indigo-purple-fuchsia rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">RAG System</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/upload"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium"
            >
              Upload
            </Link>
            <Link
              href="/chat-test"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium"
            >
              Chat
            </Link>
            <Link
              href="/test-search"
              className="text-gray-400 hover:text-white transition-colors duration-300 text-sm font-medium"
            >
              Search
            </Link>
            <Link
              href="/chat-test"
              className="px-4 py-2 gradient-indigo-purple-fuchsia rounded-lg text-white text-sm font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-purple-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
