import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/types/api';

export interface Collection {
  name: string;
  count: number;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vectorstore/collections');
      const result: ApiResponse<Collection[]> = await response.json();

      if (result.success && result.data) {
        setCollections(result.data);
        if (result.data.length > 0 && !selectedCollection) {
          setSelectedCollection(result.data[0].name);
        }
      } else {
        setError('Failed to load collections');
      }
    } catch (err) {
      setError('Network error while fetching collections');
      console.error('Failed to fetch collections:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCollection]);

  useEffect(() => {
    fetchCollections();
  }, []);

  return {
    collections,
    selectedCollection,
    setSelectedCollection,
    loading,
    error,
    refetch: fetchCollections,
  };
}
