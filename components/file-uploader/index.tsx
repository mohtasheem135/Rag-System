'use client';

import { useState } from 'react';
import { useCollections } from '@/hooks/useCollections';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileDrop } from '@/hooks/useFileDrop';
import { CollectionSelector } from './CollectionSelector';
import { FileDropZone } from './FileDropZone';
import { FilePreview } from './FilePreview';
import { UploadStatusMessage } from './UploadStatusMessage';

export default function FileUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    collections,
    selectedCollection,
    setSelectedCollection,
    loading: loadingCollections,
    refetch: refetchCollections,
  } = useCollections();

  const { uploading, uploadStatus, upload, clearStatus } = useFileUpload();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    clearStatus();
  };

  const handleError = (message: string) => {
    console.error(message);
  };

  const { dragActive, handleDrag, handleDrop, validateFile } = useFileDrop({
    onFileSelect: handleFileSelect,
    onError: handleError,
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        handleFileSelect(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCollection) return;

    await upload({
      file: selectedFile,
      collectionName: selectedCollection,
      onSuccess: async () => {
        setSelectedFile(null);
        await refetchCollections();
      },
    });
  };

  const clearFile = () => {
    setSelectedFile(null);
    clearStatus();
  };

  const canUpload = Boolean(selectedCollection) && !uploading;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <CollectionSelector
        collections={collections}
        selectedCollection={selectedCollection}
        onSelectCollection={setSelectedCollection}
        disabled={uploading}
        loading={loadingCollections}
      />

      <div>
        {!selectedFile ? (
          <FileDropZone
            dragActive={dragActive}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onFileSelect={handleFileInputChange}
            disabled={uploading}
          />
        ) : (
          <FilePreview
            file={selectedFile}
            onRemove={clearFile}
            onUpload={handleUpload}
            uploading={uploading}
            canUpload={canUpload}
          />
        )}
      </div>

      {uploadStatus.type && (
        <UploadStatusMessage
          type={uploadStatus.type}
          message={uploadStatus.message}
          stats={uploadStatus.stats}
        />
      )}
    </div>
  );
}
