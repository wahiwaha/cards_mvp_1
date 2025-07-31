import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET /api/users/[nickname]/documents - Get public documents by user nickname
export async function GET(
  request: NextRequest,
  { params }: { params: { nickname: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetNickname = decodeURIComponent(params.nickname);

    // Find user by nickname
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', targetNickname)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get public documents from this user, plus documents shared with current user
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
      .eq('owner_id', targetUser.id)
      .or(`is_public.eq.true,id.in.(${await getSharedDocumentIds(user.id, targetUser.id)})`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ 
      user: { nickname: targetNickname },
      documents 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get document IDs shared with the current user from a specific owner
async function getSharedDocumentIds(viewerId: string, ownerId: string): Promise<string> {
  const { data: shares } = await supabase
    .from('document_shares')
    .select('document_id')
    .eq('viewer_id', viewerId)
    .in('document_id', 
      supabase
        .from('documents')
        .select('id')
        .eq('owner_id', ownerId)
    );

  if (!shares || shares.length === 0) {
    return '';
  }

  return shares.map(share => share.document_id).join(',');
}