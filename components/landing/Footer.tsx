import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-indigo-purple-fuchsia rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">RAG System</span>
          </div>
          <p className="text-gray-500 text-sm">
            Powered by Next.js, LangChain, Google Gemini & ChromaDB
          </p>
        </div>
      </div>
    </footer>
  );
}
