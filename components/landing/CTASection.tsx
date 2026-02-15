import { Upload, MessageCircle, ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-24 bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Chat with Your Documents?
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Start uploading your documents and experience the power of AI-driven
          document intelligence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/upload"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 gradient-indigo-purple-fuchsia rounded-xl text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-purple-500/25"
          >
            <Upload className="w-5 h-5" />
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="/chat-test"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" />
            Try Chat
          </a>
        </div>
      </div>
    </section>
  );
}
