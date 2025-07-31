import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET /api/users/search?nickname=<nickname> - Search users by nickname
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      return NextResponse.json({ error: 'Nickname parameter is required' }, { status: 400 });
    }

    if (nickname.length < 2) {
      return NextResponse.json({ error: 'Nickname must be at least 2 characters' }, { status: 400 });
    }

    // Search for users by nickname (case-insensitive partial match)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, nickname')
      .ilike('nickname', `%${nickname}%`)
      .neq('id', user.id) // Exclude current user
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}