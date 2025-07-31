import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nickname: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          content: any;
          is_public: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          content?: any;
          is_public?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          content?: any;
          is_public?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      document_shares: {
        Row: {
          document_id: string;
          viewer_id: string;
          can_edit: boolean;
          created_at: string;
        };
        Insert: {
          document_id: string;
          viewer_id: string;
          can_edit?: boolean;
          created_at?: string;
        };
        Update: {
          document_id?: string;
          viewer_id?: string;
          can_edit?: boolean;
          created_at?: string;
        };
      };
      images: {
        Row: {
          id: string;
          document_id: string;
          storage_path: string;
          position: any;
          size: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          storage_path: string;
          position: any;
          size: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          storage_path?: string;
          position?: any;
          size?: any;
          created_at?: string;
        };
      };
    };
  };
};