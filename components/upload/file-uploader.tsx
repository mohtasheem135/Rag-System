'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import type { ApiResponse, UploadResponse } from '@/types/api';

interface UploadStats {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
  processingTime: number;
}

interface Collection {
  name: string;
  count: number;
}

export default function FileUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    stats?: UploadStats;
  }>({ type: null, message: '' });
  const [dragActive, setDragActive] = useState(false);

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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Basic validation
      const allowedExtensions = ['.pdf', '.docx', '.txt', '.csv'];
      const fileExtension = file.name
        .slice(file.name.lastIndexOf('.'))
        .toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        setUploadStatus({
          type: 'error',
          message: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
        });
        return;
      }

      setSelectedFile(file);
      setUploadStatus({ type: null, message: '' });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus({ type: null, message: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

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
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('collectionName', targetCollection);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const result: ApiResponse<UploadResponse> = await response.json();

      if (result.success && result.data) {
        setUploadStatus({
          type: 'success',
          message:
            result.message || `${selectedFile.name} processed successfully!`,
          stats: result.data.stats,
        });
        setSelectedFile(null);

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
        message: 'Network error. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus({ type: null, message: '' });
  };

  const cancelNewCollection = () => {
    setIsCreatingNew(false);
    setNewCollectionName('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Collection Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Collection
        </label>

        {!isCreatingNew ? (
          <div className="flex gap-2">
            <select
              value={selectedCollection}
              onChange={e => setSelectedCollection(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={uploading || loadingCollections}
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
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-3 bg-blue-600 border border-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
              disabled={uploading}
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
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={uploading}
              autoFocus
            />

            <button
              onClick={cancelNewCollection}
              className="px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.docx,.txt,.csv"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        {!selectedFile ? (
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, DOCX, TXT, CSV (max 20MB)
            </p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="w-8 h-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={clearFile}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Remove file"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={
                uploading || (!selectedCollection && !newCollectionName.trim())
              }
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload & Process'}
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {uploadStatus.type && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            uploadStatus.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{uploadStatus.message}</p>
            {uploadStatus.stats && (
              <div className="mt-2 text-xs space-y-1">
                <p>Total chunks: {uploadStatus.stats.totalChunks}</p>
                <p>Processing time: {uploadStatus.stats.processingTime}ms</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
