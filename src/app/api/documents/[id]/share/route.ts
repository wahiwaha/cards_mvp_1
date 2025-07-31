import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// POST /api/documents/[id]/share - Share document with user
export async function POST(
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
    const { viewerNickname, canEdit = false } = body;

    if (!viewerNickname) {
      return NextResponse.json({ error: 'Viewer nickname is required' }, { status: 400 });
    }

    // Check if user owns this document
    const { data: document } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .single();

    if (!document || document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Find viewer by nickname
    const { data: viewer } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', viewerNickname)
      .single();

    if (!viewer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already shared
    const { data: existingShare } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId)
      .eq('viewer_id', viewer.id)
      .single();

    if (existingShare) {
      // Update existing share
      const { data: updatedShare, error } = await supabase
        .from('document_shares')
        .update({ can_edit: canEdit })
        .eq('document_id', documentId)
        .eq('viewer_id', viewer.id)
        .select(`
          document_id,
          viewer_id,
          can_edit,
          created_at,
          users!document_shares_viewer_id_fkey (nickname)
        `)
        .single();

      if (error) {
        console.error('Error updating share:', error);
        return NextResponse.json({ error: 'Failed to update share' }, { status: 500 });
      }

      return NextResponse.json({ share: updatedShare });
    } else {
      // Create new share
      const { data: newShare, error } = await supabase
        .from('document_shares')
        .insert([
          {
            document_id: documentId,
            viewer_id: viewer.id,
            can_edit: canEdit,
          },
        ])
        .select(`
          document_id,
          viewer_id,
          can_edit,
          created_at,
          users!document_shares_viewer_id_fkey (nickname)
        `)
        .single();

      if (error) {
        console.error('Error creating share:', error);
        return NextResponse.json({ error: 'Failed to share document' }, { status: 500 });
      }

      return NextResponse.json({ share: newShare }, { status: 201 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/share - Remove document share
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
    const { searchParams } = new URL(request.url);
    const viewerNickname = searchParams.get('viewerNickname');

    if (!viewerNickname) {
      return NextResponse.json({ error: 'Viewer nickname is required' }, { status: 400 });
    }

    // Check if user owns this document
    const { data: document } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', documentId)
      .single();

    if (!document || document.owner_id !== user.id) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Find viewer by nickname
    const { data: viewer } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', viewerNickname)
      .single();

    if (!viewer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('document_id', documentId)
      .eq('viewer_id', viewer.id);

    if (error) {
      console.error('Error removing share:', error);
      return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}