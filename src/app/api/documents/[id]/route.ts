import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET /api/documents/[id] - Get specific document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Check if user has access to this document
    const hasAccess = await checkDocumentAccess(documentId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        content,
        is_public,
        version,
        created_at,
        updated_at,
        owner_id,
        users!documents_owner_id_fkey (nickname)
      `)
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/documents/[id] - Update document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const { title, content, is_public, version: clientVersion } = body;

    // Check if user has edit access to this document
    const canEdit = await checkDocumentEditAccess(documentId, user.id);
    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get current document to check version
    const { data: currentDoc } = await supabase
      .from('documents')
      .select('version')
      .eq('id', documentId)
      .single();

    if (currentDoc && clientVersion && currentDoc.version !== clientVersion) {
      return NextResponse.json(
        { 
          error: 'Version conflict',
          currentVersion: currentDoc.version,
          clientVersion 
        },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (currentDoc) updateData.version = currentDoc.version + 1;

    const { data: document, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select(`
        id,
        title,
        content,
        is_public,
        version,
        created_at,
        updated_at,
        owner_id,
        users!documents_owner_id_fkey (nickname)
      `)
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Check if user owns this document
    const { data: document } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .single();

    if (!document || document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
async function checkDocumentAccess(documentId: string, userId: string): Promise<boolean> {
  // Check if user owns the document
  const { data: ownedDoc } = await supabase
    .from('documents')
    .select('id')
    .eq('id', documentId)
    .eq('owner_id', userId)
    .single();

  if (ownedDoc) return true;

  // Check if document is public
  const { data: publicDoc } = await supabase
    .from('documents')
    .select('id')
    .eq('id', documentId)
    .eq('is_public', true)
    .single();

  if (publicDoc) return true;

  // Check if user has shared access
  const { data: sharedDoc } = await supabase
    .from('document_shares')
    .select('document_id')
    .eq('document_id', documentId)
    .eq('viewer_id', userId)
    .single();

  return !!sharedDoc;
}

async function checkDocumentEditAccess(documentId: string, userId: string): Promise<boolean> {
  // Check if user owns the document
  const { data: ownedDoc } = await supabase
    .from('documents')
    .select('id')
    .eq('id', documentId)
    .eq('owner_id', userId)
    .single();

  if (ownedDoc) return true;

  // Check if user has edit permission through sharing
  const { data: editAccess } = await supabase
    .from('document_shares')
    .select('document_id')
    .eq('document_id', documentId)
    .eq('viewer_id', userId)
    .eq('can_edit', true)
    .single();

  return !!editAccess;
}