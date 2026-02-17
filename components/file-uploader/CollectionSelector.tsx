'use client';

import type { Collection } from './types';

interface CollectionSelectorProps {
  collections: Collection[];
  selectedCollection: string;
  onSelectCollection: (name: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function CollectionSelector({
  collections,
  selectedCollection,
  onSelectCollection,
  disabled = false,
  loading = false,
}: CollectionSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Collection
      </label>

      <select
        value={selectedCollection}
        onChange={e => onSelectCollection(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        disabled={disabled || loading}
      >
        {collections.length === 0 && (
          <option value="">No collections available</option>
        )}
        {collections.map(col => (
          <option key={col.name} value={col.name}>
            {col.name} ({col.count} {col.count === 1 ? 'doc' : 'docs'})
          </option>
        ))}
      </select>
    </div>
  );
}
