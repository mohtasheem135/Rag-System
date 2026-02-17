'use client';

import { useState, useEffect } from 'react';
import { Brain, Database, Loader2, Eye, Plus, X } from 'lucide-react';
import type { ApiResponse, UploadResponse } from '@/types/api';

interface Collection {
  name: string;
  count: number;
}

export function HFUploader() {
  const [datasetName, setDatasetName] = useState('');
  const [split, setSplit] = useState('train');
  const [pageContentColumn, setPageContentColumn] = useState('text');
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [config, setConfig] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    data?: UploadResponse;
  }>({ type: null, message: '' });
  const [previewData, setPreviewData] = useState<any>(null);

  // Collection management state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoadingCollections(true);
    try {
      const response = await fetch('/api/vectorstore/collections');
      const result: ApiResponse<Collection[]> = await response.json();

      if (result.success && result.data) {
        setCollections(result.data);
        if (result.data.length > 0 && !selectedCollection) {
          setSelectedCollection(result.data[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to load collections',
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  const cancelNewCollection = () => {
    setIsCreatingNew(false);
    setNewCollectionName('');
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datasetName || !pageContentColumn) {
      setUploadStatus({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    setPreviewing(true);
    setUploadStatus({ type: null, message: '' });
    setPreviewData(null);

    try {
      const response = await fetch('/api/ingest/huggingface/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName,
          split,
          pageContentColumn,
          config: config || undefined,
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setPreviewData(result.data);
        setUploadStatus({
          type: 'success',
          message: `Preview loaded: ${result.data.totalDocuments} documents found`,
        });
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Preview failed',
        });
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Preview failed',
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datasetName || !pageContentColumn) {
      setUploadStatus({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    // Determine which collection to use
    const targetCollection =
      isCreatingNew && newCollectionName.trim()
        ? newCollectionName.trim()
        : selectedCollection;

    if (!targetCollection) {
      setUploadStatus({
        type: 'error',
        message: 'Please select or create a collection',
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/ingest/huggingface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetName,
          split,
          pageContentColumn,
          collectionName: targetCollection,
          config: config || undefined,
        }),
      });

      const result: ApiResponse<UploadResponse> = await response.json();

      if (result.success && result.data) {
        setUploadStatus({
          type: 'success',
          message: result.message || 'Dataset processed successfully!',
          data: result.data,
        });
        setDatasetName('');
        setPreviewData(null);

        // Refresh collections after successful upload
        if (isCreatingNew) {
          await fetchCollections();
          setSelectedCollection(targetCollection);
          setIsCreatingNew(false);
          setNewCollectionName('');
        } else {
          // Just refresh the count
          await fetchCollections();
        }
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Upload failed',
        });
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Collection Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Collection <span className="text-red-400">*</span>
          </label>

          {!isCreatingNew ? (
            <div className="flex gap-2">
              <select
                value={selectedCollection}
                onChange={e => setSelectedCollection(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || previewing || loadingCollections}
              >
                {collections.length === 0 && (
                  <option value="">No collections yet</option>
                )}
                {collections.map(col => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.count} {col.count === 1 ? 'doc' : 'docs'})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="px-4 py-3 bg-purple-600 border border-purple-600 rounded-xl text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || previewing}
                title="Create new collection"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Enter new collection name"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || previewing}
                autoFocus
              />

              <button
                type="button"
                onClick={cancelNewCollection}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || previewing}
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Choose where to store the dataset documents
          </p>
        </div>

        {/* Dataset Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Dataset Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={e => setDatasetName(e.target.value)}
            placeholder="e.g., B00MEMBERX/FULL_EPSTEIN_INDEX"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={uploading || previewing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: username/dataset-name
          </p>
        </div>

        {/* Split */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Split
          </label>
          <select
            value={split}
            onChange={e => setSplit(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={uploading || previewing}
          >
            <option value="train">train</option>
            <option value="test">test</option>
            <option value="validation">validation</option>
          </select>
        </div>

        {/* configuration (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Configuration (optional)
          </label>
          <input
            type="text"
            value={config}
            onChange={e => setConfig(e.target.value)}
            placeholder="e.g., plain_text, default"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={uploading || previewing}
          />
          <p className="text-xs text-gray-500 mt-1">
            Some datasets require a config (check dataset page)
          </p>
        </div>

        {/* Content Column */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Text Content Column <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={pageContentColumn}
            onChange={e => setPageContentColumn(e.target.value)}
            placeholder="e.g., text, content, body"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={uploading || previewing}
          />
          <p className="text-xs text-gray-500 mt-1">
            The column containing the main text content
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={
              uploading || previewing || !datasetName || !pageContentColumn
            }
            className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {previewing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Preview...
              </>
            ) : (
              <>
                <Eye className="w-5 h-5" />
                Preview
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={
              uploading ||
              previewing ||
              !datasetName ||
              !pageContentColumn ||
              (!selectedCollection && !newCollectionName.trim())
            }
            className="flex-1 px-6 py-4 gradient-indigo-purple-fuchsia rounded-xl text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Load Dataset
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preview Display */}
      {previewData && (
        <div className="mt-6 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Dataset Preview
          </h3>

          <div className="space-y-4">
            <div className="text-sm">
              <span className="text-gray-400">Total Documents:</span>{' '}
              <span className="text-white font-semibold">
                {previewData.totalDocuments}
              </span>
            </div>

            <div className="text-sm">
              <span className="text-gray-400">All Valid:</span>{' '}
              <span
                className={`font-semibold ${
                  previewData.allDocumentsValid
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {previewData.allDocumentsValid ? '✓ Yes' : '✗ No'}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Sample Documents:
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {previewData.preview.map((doc: any) => (
                  <div
                    key={doc.index}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      Document {doc.index + 1} ({doc.contentLength} chars)
                    </div>
                    <div className="text-sm text-gray-300 font-mono break-words">
                      {doc.contentPreview}
                    </div>
                    <details className="mt-2">
                      <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">
                        View full content
                      </summary>
                      <div className="mt-2 text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {doc.fullContent}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus.type && (
        <div
          className={`mt-6 p-4 rounded-xl ${
            uploadStatus.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}
        >
          <p
            className={`font-medium ${
              uploadStatus.type === 'success'
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {uploadStatus.message}
          </p>

          {uploadStatus.data && (
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Chunks Created: {uploadStatus.data.chunksCreated}</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Vectors Stored: {uploadStatus.data.vectorsStored}</span>
              </div>
              {uploadStatus.data.stats && (
                <div className="text-xs text-gray-500 mt-2">
                  Processing time: {uploadStatus.data.stats.processingTime}ms
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
