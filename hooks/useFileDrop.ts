import { useState, useCallback } from 'react';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface UseFileDropOptions {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
}

export function useFileDrop({ onFileSelect, onError }: UseFileDropOptions) {
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): boolean => {
    const fileExtension = file.name
      .slice(file.name.lastIndexOf('.'))
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      onError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError('File size exceeds 20MB limit');
      return false;
    }

    return true;
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect, onError]
  );

  return {
    dragActive,
    handleDrag,
    handleDrop,
    validateFile,
  };
}
