import { Upload, Database, Search, Brain } from 'lucide-react';
import { FeatureCard } from './FeatureCard';

export function FeaturesSection() {
  return (
    <section className="relative py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A powerful Retrieval-Augmented Generation system that transforms
            your documents into an intelligent knowledge base.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={Upload}
            title="Upload Documents"
            description="Support for PDF, DOCX, and TXT files. Simply drag and drop or browse to upload your documents."
          />
          <FeatureCard
            icon={Database}
            title="Vector Storage"
            description="Documents are chunked and embedded using state-of-the-art models, then stored in ChromaDB for efficient retrieval."
          />
          <FeatureCard
            icon={Search}
            title="Smart Retrieval"
            description="Semantic search finds the most relevant document chunks based on meaning, not just keywords."
          />
          <FeatureCard
            icon={Brain}
            title="AI Responses"
            description="Google Gemini generates accurate, contextual answers based on your document content."
          />
        </div>
      </div>
    </section>
  );
}
