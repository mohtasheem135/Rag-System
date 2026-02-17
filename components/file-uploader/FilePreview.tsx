'use client';

import { File, X } from 'lucide-react';

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  onUpload: () => void;
  uploading: boolean;
  canUpload: boolean;
}

export function FilePreview({
  file,
  onRemove,
  onUpload,
  uploading,
  canUpload,
}: FilePreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <File className="w-8 h-8 text-blue-500" />
          <div className="text-left">
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        {!uploading && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-200 rounded"
            title="Remove file"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <button
        onClick={onUpload}
        disabled={uploading || !canUpload}
        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? 'Uploading...' : 'Upload & Process'}
      </button>
    </div>
  );
}
