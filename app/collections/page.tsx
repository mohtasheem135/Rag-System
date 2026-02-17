// app/collections/page.tsx
'use client';

import { useState } from 'react';
import { Trash2, Plus, Database, Loader2, FolderOpen } from 'lucide-react';
import type { ApiResponse } from '@/types/api';
import { useCollections } from '@/hooks/useCollections';

export default function CollectionsPage() {
  // ✅ REPLACED: 2 useState + 1 useEffect + fetchCollections → single hook call
  const {
    collections,
    loading,
    refetch: fetchCollections,
  } = useCollections();

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) {
      showMsg('error', 'Collection name is required');
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('/api/vectorstore/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      const result: ApiResponse = await response.json();
      if (result.success) {
        showMsg('success', `Collection "${newCollectionName}" created!`);
        setNewCollectionName('');
        setShowCreateForm(false);
        await fetchCollections(); // ✅ hook's refetch
      } else {
        showMsg('error', result.error ?? 'Failed to create collection');
      }
    } catch {
      showMsg('error', 'Error creating collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async (name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete collection "${name}"? This will delete all documents in it.`
      )
    ) {
      return;
    }
    setDeleting(name);
    try {
      const response = await fetch(
        `/api/vectorstore/collections/${encodeURIComponent(name)}`,
        { method: 'DELETE' }
      );
      const result: ApiResponse = await response.json();
      if (result.success) {
        showMsg('success', `Collection "${name}" deleted`);
        await fetchCollections(); // ✅ hook's refetch
      } else {
        showMsg('error', result.error ?? 'Failed to delete collection');
      }
    } catch {
      showMsg('error', 'Error deleting collection');
    } finally {
      setDeleting(null);
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Collections Manager
          </h1>
          <p className="text-gray-400">
            Manage your vector database collections
          </p>
        </div>

        {/* Status Message */}
        {message.type && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Create Collection Button */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Collection
          </button>
        )}

        {/* Create Collection Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateCollection}
            className="mb-6 p-6 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Create New Collection
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={creating}
                autoFocus
              />
              <button
                type="submit"
                disabled={creating || !newCollectionName.trim()}
                className="px-6 py-3 bg-purple-600 rounded-xl text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCollectionName('');
                }}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Collections List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
            <FolderOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No Collections Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first collection to get started
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-purple-600 rounded-xl text-white font-semibold hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Collection
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {collections.map(collection => (
              <div
                key={collection.name}
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg">
                      <Database className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {collection.count.toLocaleString()}{' '}
                        {collection.count === 1 ? 'document' : 'documents'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCollection(collection.name)}
                    disabled={deleting === collection.name}
                    className="px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting === collection.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
