import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET /api/search?q=<query> - Search documents by title and content
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    // Search in user's own documents and shared documents
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
      .or(`title.ilike.%${query}%,content->>text.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error searching documents:', error);
      return NextResponse.json({ error: 'Failed to search documents' }, { status: 500 });
    }

    // Also search public documents from other users
    const { data: publicDocuments, error: publicError } = await supabase
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
      .eq('is_public', true)
      .neq('owner_id', user.id)
      .or(`title.ilike.%${query}%,content->>text.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (publicError) {
      console.error('Error searching public documents:', publicError);
    }

    // Combine results and remove duplicates
    const allDocuments = [...(documents || []), ...(publicDocuments || [])];
    const uniqueDocuments = allDocuments.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    return NextResponse.json({ 
      documents: uniqueDocuments.slice(0, 20),
      query 
    });
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