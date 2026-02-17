export interface UploadStats {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalCharacters: number;
  processingTime: number;
}

export interface Collection {
  name: string;
  count: number;
}

export interface UploadStatusState {
  type: 'success' | 'error' | null;
  message: string;
  stats?: UploadStats;
}
