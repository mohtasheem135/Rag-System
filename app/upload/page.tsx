'use client';

import { useState } from 'react';
import { FileUp, Database } from 'lucide-react';
import FileUploader from '@/components/file-uploader';
import { HFUploader } from '@/components/hf-uploader';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<'files' | 'huggingface'>('files');

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upload{' '}
            <span className="gradient-indigo-purple-fuchsia bg-clip-text text-transparent">
              Documents
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Add documents to your knowledge base
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'files'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <FileUp className="w-5 h-5" />
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab('huggingface')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'huggingface'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Database className="w-5 h-5" />
            Hugging Face Dataset
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {activeTab === 'files' ? <FileUploader /> : <HFUploader />}
        </div>
      </div>
    </div>
  );
}
