-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '{"blocks": []}' NOT NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create document_shares table
CREATE TABLE IF NOT EXISTS public.document_shares (
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (document_id, viewer_id)
);

-- Create images table
CREATE TABLE IF NOT EXISTS public.images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  position JSONB DEFAULT '{"x": 0, "y": 0}' NOT NULL,
  size JSONB DEFAULT '{"width": 300, "height": 200}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON public.documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON public.documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_shares_viewer_id ON public.document_shares(viewer_id);
CREATE INDEX IF NOT EXISTS idx_images_document_id ON public.images(document_id);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON public.users(nickname);

-- Create full-text search index for documents
CREATE INDEX IF NOT EXISTS idx_documents_search ON public.documents USING gin(to_tsvector('english', title || ' ' || (content->>'text')));

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for documents table
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public documents" ON public.documents
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view shared documents" ON public.documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT viewer_id FROM public.document_shares 
      WHERE document_id = documents.id
    )
  );

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users with edit permission can update shared documents" ON public.documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT viewer_id FROM public.document_shares 
      WHERE document_id = documents.id AND can_edit = true
    )
  );

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for document_shares table
CREATE POLICY "Users can view shares for their documents" ON public.document_shares
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.documents WHERE id = document_id
    )
  );

CREATE POLICY "Users can view their own shares" ON public.document_shares
  FOR SELECT USING (auth.uid() = viewer_id);

CREATE POLICY "Document owners can manage shares" ON public.document_shares
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.documents WHERE id = document_id
    )
  );

-- RLS Policies for images table
CREATE POLICY "Users can view images in accessible documents" ON public.images
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM public.documents 
      WHERE owner_id = auth.uid() 
         OR is_public = true
         OR id IN (
           SELECT document_id FROM public.document_shares 
           WHERE viewer_id = auth.uid()
         )
    )
  );

CREATE POLICY "Users can manage images in their documents" ON public.images
  FOR ALL USING (
    document_id IN (
      SELECT id FROM public.documents WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage images in editable shared documents" ON public.images
  FOR ALL USING (
    document_id IN (
      SELECT document_id FROM public.document_shares 
      WHERE viewer_id = auth.uid() AND can_edit = true
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document-images', 'document-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'document-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'document-images');

CREATE POLICY "Users can update their images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'document-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'document-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );