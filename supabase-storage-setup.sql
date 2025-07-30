-- Cards 프로젝트 Storage 설정
-- Supabase SQL Editor에서 실행하세요

-- 1. note-images 버킷 생성
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-images', 'note-images', true);

-- 2. Storage 정책 생성
-- 인증된 사용자는 이미지 업로드 가능
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'note-images' 
    AND auth.role() = 'authenticated'
  );

-- 누구나 이미지 조회 가능 (공개 버킷)
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'note-images');

-- 사용자는 자신이 업로드한 이미지만 수정/삭제 가능
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'note-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'note-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );