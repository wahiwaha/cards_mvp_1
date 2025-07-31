'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Share2, 
  Globe, 
  Lock, 
  MoreHorizontal, 
  Trash2,
  Users,
  X,
  UserPlus 
} from 'lucide-react';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import DocumentEditor from '@/components/DocumentEditor';

interface DocumentData {
  id: string;
  title: string;
  content: {
    blocks: any[];
  };
  version: number;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  users: { nickname: string };
}

interface DocumentShare {
  document_id: string;
  viewer_id: string;
  can_edit: boolean;
  created_at: string;
  users: { nickname: string };
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareNickname, setShareNickname] = useState('');
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      const loadDocumentAsync = async () => {
        const { id } = await params;
        loadDocument(id);
      };
      loadDocumentAsync();
    }
  }, [user, params]);

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
    }
  };

  const loadDocument = async (documentId: string) => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      });

      if (response.status === 404) {
        setError('Document not found or you don\'t have access to it');
        return;
      }

      if (!response.ok) throw new Error('Failed to load document');

      const { document } = await response.json();
      setDocument(document);

      // Load shares if user owns the document
      if (document.owner_id === user.id) {
        await loadShares();
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadShares = async () => {
    if (!user || !document) return;

    try {
      const { data: shares, error } = await supabase
        .from('document_shares')
        .select(`
          document_id,
          viewer_id,
          can_edit,
          created_at,
          users!document_shares_viewer_id_fkey!inner (nickname)
        `)
        .eq('document_id', document.id) as { data: DocumentShare[] | null; error: any };

      if (error) throw error;
      setShares(shares || []);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const shareDocument = async () => {
    if (!user || !document || !shareNickname.trim()) return;

    setSharingLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`/api/documents/${document.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          viewerNickname: shareNickname.trim(),
          canEdit: shareCanEdit,
        }),
      });

      if (response.status === 404) {
        setError('User not found');
        return;
      }

      if (!response.ok) throw new Error('Failed to share document');

      await loadShares();
      setShareNickname('');
      setShareCanEdit(false);
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing document:', error);
      setError('Failed to share document');
    } finally {
      setSharingLoading(false);
    }
  };

  const removeShare = async (viewerNickname: string) => {
    if (!user || !document) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `/api/documents/${document.id}/share?viewerNickname=${encodeURIComponent(viewerNickname)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to remove share');

      await loadShares();
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  const togglePublic = async () => {
    if (!user || !document || document.owner_id !== user.id) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          is_public: !document.is_public,
          version: document.version,
        }),
      });

      if (!response.ok) throw new Error('Failed to update document');

      const { document: updatedDoc } = await response.json();
      setDocument(updatedDoc);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const deleteDocument = async () => {
    if (!user || !document || document.owner_id !== user.id) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete document');

      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading document...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error || 'Document not found'}</div>
          <Link href="/dashboard" className="notion-btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = document.owner_id === user?.id || shares.some(s => s.viewer_id === user?.id && s.can_edit);
  const isOwner = document.owner_id === user?.id;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="notion-btn-ghost"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{document.users.nickname}</span>
              <span>/</span>
              <span className="font-medium">{document.title || 'Untitled'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Public/Private indicator */}
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              {document.is_public ? (
                <Globe size={16} className="text-green-500" />
              ) : (
                <Lock size={16} className="text-gray-400" />
              )}
              <span>{document.is_public ? 'Public' : 'Private'}</span>
            </div>

            {/* Share button */}
            {isOwner && (
              <button
                onClick={() => setShowShareModal(true)}
                className="notion-btn-secondary"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </button>
            )}

            {/* More options */}
            {isOwner && (
              <div className="relative">
                <button className="notion-btn-ghost">
                  <MoreHorizontal size={16} />
                </button>
                {/* Dropdown would go here */}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Document Editor */}
      <main className="pb-20">
        <DocumentEditor
          documentId={document.id}
          initialData={document}
          canEdit={canEdit}
          onSave={(updatedDoc) => setDocument(updatedDoc)}
        />
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Share document</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Share settings */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={document.is_public}
                    onChange={togglePublic}
                    className="rounded"
                  />
                  <span className="text-sm">Make public (anyone can view)</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Add people</h4>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter nickname"
                    value={shareNickname}
                    onChange={(e) => setShareNickname(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center space-x-1 text-sm">
                    <input
                      type="checkbox"
                      checked={shareCanEdit}
                      onChange={(e) => setShareCanEdit(e.target.checked)}
                      className="rounded"
                    />
                    <span>Edit</span>
                  </label>
                  <button
                    onClick={shareDocument}
                    disabled={!shareNickname.trim() || sharingLoading}
                    className="notion-btn-primary disabled:opacity-50"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Current shares */}
            {shares.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center">
                  <Users size={16} className="mr-2" />
                  Shared with ({shares.length})
                </h4>
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.viewer_id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {share.users.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm">{share.users.nickname}</span>
                        <span className="text-xs text-gray-500">
                          ({share.can_edit ? 'Edit' : 'View'})
                        </span>
                      </div>
                      <button
                        onClick={() => removeShare(share.users.nickname)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delete document */}
            <div className="border-t pt-4 mt-6">
              <button
                onClick={deleteDocument}
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
                <span>Delete document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}