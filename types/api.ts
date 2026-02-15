export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  documentId: string;
  filename: string;
  status: string;
  chunksCreated?: number;
  vectorsStored?: number; // Add this
  stats?: {
    totalChunks: number;
    avgChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    totalCharacters: number;
    processingTime: number;
  };
}
