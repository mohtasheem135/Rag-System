import FileUploader from '@/components/upload/file-uploader';
import { Upload, FileText, Sparkles, MessageCircle } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-indigo-purple-fuchsia rounded-2xl mb-6">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-indigo-purple-fuchsia bg-clip-text text-transparent">
              Upload Documents
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Upload PDF, DOCX, or TXT files to add them to your knowledge base
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm mb-8">
          <FileUploader />
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-8">
          <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Next Steps
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Upload,
                step: '1',
                title: 'Upload Document',
                description: 'Upload your document using the form above',
              },
              {
                icon: FileText,
                step: '2',
                title: 'Process & Chunk',
                description:
                  'Document will be processed and chunked automatically',
              },
              {
                icon: Sparkles,
                step: '3',
                title: 'Generate Embeddings',
                description:
                  'Embeddings will be generated and stored in the vector database',
              },
              {
                icon: MessageCircle,
                step: '4',
                title: 'Start Chatting',
                description: 'You can then chat with your documents',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 gradient-indigo-purple-fuchsia rounded-lg flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
