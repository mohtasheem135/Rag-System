import { useState } from 'react';
import type { ApiResponse, UploadResponse } from '@/types/api';

interface UploadOptions {
  file: File;
  collectionName: string;
  onSuccess?: () => void;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    stats?: UploadResponse['stats'];
  }>({ type: null, message: '' });

  const upload = async ({ file, collectionName, onSuccess }: UploadOptions) => {
    if (!collectionName) {
      setUploadStatus({
        type: 'error',
        message: 'Please select or create a collection',
      });
      return false;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collectionName', collectionName);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const result: ApiResponse<UploadResponse> = await response.json();

      if (result.success && result.data) {
        setUploadStatus({
          type: 'success',
          message: result.message || `${file.name} processed successfully!`,
          stats: result.data.stats,
        });
        onSuccess?.();
        return true;
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Upload failed',
        });
        return false;
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Network error. Please try again.',
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const clearStatus = () => {
    setUploadStatus({ type: null, message: '' });
  };

  return {
    uploading,
    uploadStatus,
    upload,
    clearStatus,
  };
}
