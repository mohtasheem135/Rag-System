'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';
import type { UploadResponse } from '@/types/api';

interface UploadStatusMessageProps {
  type: 'success' | 'error';
  message: string;
  stats?: UploadResponse['stats'];
}

export function UploadStatusMessage({
  type,
  message,
  stats,
}: UploadStatusMessageProps) {
  return (
    <div
      className={`p-4 rounded-lg flex items-start space-x-3 ${
        type === 'success'
          ? 'bg-green-50 text-green-800'
          : 'bg-red-50 text-red-800'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {stats && (
          <div className="mt-2 text-xs space-y-1">
            <p>Total chunks: {stats.totalChunks}</p>
            <p>Processing time: {stats.processingTime}ms</p>
          </div>
        )}
      </div>
    </div>
  );
}
