import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET /api/documents - Get user's documents
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        is_public,
        version,
        created_at,
        updated_at,
        owner_id,
        users!documents_owner_id_fkey (nickname)
      `)
      .or(`owner_id.eq.${user.id},id.in.(${await getSharedDocumentIds(user.id)})`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = 'Untitled', content = { blocks: [] }, is_public = false } = body;

    const { data: document, error } = await supabase
      .from('documents')
      .insert([
        {
          owner_id: user.id,
          title,
          content,
          is_public,
          version: 1,
        },
      ])
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
      console.error('Error creating document:', error);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get shared document IDs
async function getSharedDocumentIds(userId: string): Promise<string> {
  const { data: shares } = await supabase
    .from('document_shares')
    .select('document_id')
    .eq('viewer_id', userId);

  if (!shares || shares.length === 0) {
    return '';
  }

  return shares.map(share => share.document_id).join(',');
}