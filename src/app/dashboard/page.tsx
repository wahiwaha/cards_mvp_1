'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  FileText, 
  Share2, 
  User, 
  LogOut, 
  Trash2,
  Globe,
  Lock,
  Edit3 
} from 'lucide-react';
import { getCurrentUser, signOut, type AuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface Document {
  id: string;
  title: string;
  is_public: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  owner_id: string;
  users: { nickname: string };
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchDocuments();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load documents');

      const { documents } = await response.json();
      setDocuments(documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const searchDocuments = async () => {
    if (!user || searchQuery.length < 2) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to search documents');

      const { documents } = await response.json();
      setSearchResults(documents);
    } catch (error) {
      console.error('Error searching documents:', error);
    }
  };

  const createDocument = async () => {
    if (!user || creating) return;

    setCreating(true);
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          title: 'Untitled',
          content: { blocks: [{ id: 'initial', type: 'text', content: '' }] },
        }),
      });

      if (!response.ok) throw new Error('Failed to create document');

      const { document } = await response.json();
      await loadDocuments();
      router.push(`/document/${document.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user || !confirm('Are you sure you want to delete this document?')) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete document');

      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayDocuments = searchQuery.length >= 2 ? searchResults : documents;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="notion-sidebar h-screen overflow-y-auto">
        <div className="p-4">
          {/* User info */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-sm">{user.nickname}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* New document button */}
          <button
            onClick={createDocument}
            disabled={creating}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-4 disabled:opacity-50"
          >
            <Plus size={16} />
            <span>{creating ? 'Creating...' : 'New Document'}</span>
          </button>

          {/* Navigation */}
          <nav className="space-y-1 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md"
            >
              <FileText size={16} />
              <span>My Documents</span>
            </Link>
            <Link
              href="/shared"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Share2 size={16} />
              <span>Shared with me</span>
            </Link>
          </nav>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {searchQuery.length >= 2 ? `Search results for "${searchQuery}"` : 'My Documents'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {searchQuery.length >= 2 
                    ? `Found ${displayDocuments.length} document${displayDocuments.length !== 1 ? 's' : ''}`
                    : `${documents.length} document${documents.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
              <button
                onClick={createDocument}
                disabled={creating}
                className="notion-btn-primary disabled:opacity-50"
              >
                <Plus size={16} className="mr-2" />
                {creating ? 'Creating...' : 'New Document'}
              </button>
            </div>

            {/* Documents grid */}
            {displayDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery.length >= 2 ? 'No documents found' : 'No documents yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery.length >= 2 
                    ? 'Try adjusting your search query'
                    : 'Create your first document to get started'
                  }
                </p>
                {searchQuery.length < 2 && (
                  <button
                    onClick={createDocument}
                    disabled={creating}
                    className="notion-btn-primary disabled:opacity-50"
                  >
                    <Plus size={16} className="mr-2" />
                    Create Document
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1 truncate">
                          {doc.title || 'Untitled'}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {doc.is_public ? (
                            <Globe size={12} className="text-green-500" />
                          ) : (
                            <Lock size={12} className="text-gray-400" />
                          )}
                          <span>{doc.is_public ? 'Public' : 'Private'}</span>
                          {doc.owner_id !== user.id && (
                            <>
                              <span>•</span>
                              <span>by {doc.users.nickname}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {doc.owner_id === user.id && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              deleteDocument(doc.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                    </div>

                    <Link
                      href={`/document/${doc.id}`}
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Edit3 size={14} />
                      <span>Open</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}