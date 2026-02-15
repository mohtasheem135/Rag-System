import { Zap, FileText, Database, Brain, MessageCircle } from 'lucide-react';
import { StepCard } from './StepCard';

export function ProcessSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-black to-gray-950">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple Process,
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Powerful Results
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Our RAG pipeline handles everything from document processing to
              intelligent response generation, so you can focus on what matters
              - getting insights from your data.
            </p>

            <div className="space-y-6">
              <StepCard
                number="1"
                title="Upload Your Documents"
                description="Add PDFs, Word documents, or text files to your knowledge base."
              />
              <StepCard
                number="2"
                title="Automatic Processing"
                description="Documents are automatically chunked, embedded, and stored in the vector database."
              />
              <StepCard
                number="3"
                title="Ask Questions"
                description="Chat naturally with your documents using our intuitive interface."
              />
              <StepCard
                number="4"
                title="Get Smart Answers"
                description="Receive accurate, contextual responses with source citations."
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 gradient-indigo-purple-fuchsia rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">RAG Pipeline</h4>
                  <p className="text-gray-500 text-sm">Powered by LangChain</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-300 text-sm">Document Loader</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300 text-sm">
                    ChromaDB Vector Store
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-300 text-sm">
                    Google Gemini LLM
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300 text-sm">Chat Interface</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
