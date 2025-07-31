import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
}

export async function signUp(email: string, password: string, nickname: string) {
  // Check if nickname is already taken
  const { data: existingUser } = await supabase
    .from('users')
    .select('nickname')
    .eq('nickname', nickname)
    .single();

  if (existingUser) {
    throw new Error('Nickname already exists');
  }

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Failed to create user');

  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([
      {
        id: data.user.id,
        nickname,
      },
    ]);

  if (profileError) throw profileError;

  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email!,
    nickname: profile.nickname,
  };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Middleware helper for API routes
export async function verifyAuth(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return null;

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      id: user.id,
      email: user.email!,
      nickname: profile.nickname,
    };
  } catch {
    return null;
  }
}

// Client-side auth state management
export function createAuthStateManager() {
  const listeners = new Set<(user: AuthUser | null) => void>();

  supabase.auth.onAuthStateChange(async (event, session) => {
    let user: AuthUser | null = null;

    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        user = {
          id: session.user.id,
          email: session.user.email!,
          nickname: profile.nickname,
        };
      }
    }

    listeners.forEach(listener => listener(user));
  });

  return {
    subscribe: (callback: (user: AuthUser | null) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    getCurrentUser,
  };
}