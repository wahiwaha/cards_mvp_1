# Cards - 간단하고 세련된 노트 정리 플랫폼

노션과 같은 편리한 노트 정리 기능과 간편한 공유 시스템을 제공하는 세련된 노트 관리 플랫폼입니다.

## 주요 기능

✨ **회원가입/로그인** - Supabase 인증을 통한 안전한 사용자 관리  
📝 **노트 작성/편집** - 실시간 텍스트 편집 및 이미지 첨부 기능  
📁 **파일/폴더 정리** - 체계적인 노트 관리 시스템  
🌐 **노트 공유** - 원클릭 공개/비공개 설정 및 링크 공유  
📱 **반응형 디자인** - 모바일, 태블릿, 데스크톱 완벽 지원  
🎨 **미니멀 디자인** - 디터 람스/애플 스타일의 세련된 UI

## 기술 스택

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (인증, 데이터베이스, 스토리지)
- **Deployment**: Vercel

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone [repository-url]
cd cards
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 빌드
```bash
npm run build
npm start
```

## Supabase 설정

### 데이터베이스 스키마

```sql
-- notes 테이블
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- RLS 정책
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- 공개 노트 조회 정책
CREATE POLICY "Anyone can view public notes" ON notes
  FOR SELECT USING (is_public = true);
```

### 스토리지 설정

```sql
-- note-images 버킷 생성 및 정책 설정
INSERT INTO storage.buckets (id, name, public) VALUES ('note-images', 'note-images', true);

CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'note-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'note-images');
```

## 배포

### Vercel 배포
1. GitHub에 프로젝트 푸시
2. Vercel에서 프로젝트 import
3. 환경변수 설정
4. 자동 배포 완료

## 프로젝트 구조

```
src/
├── app/
│   ├── dashboard/          # 메인 대시보드
│   ├── login/             # 로그인 페이지
│   ├── signUp/            # 회원가입 페이지
│   ├── note/[id]/         # 공유 노트 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지 (리다이렉트)
├── components/            # 재사용 컴포넌트
├── lib/
│   └── supabase.ts       # Supabase 클라이언트
└── styles/
    └── globals.css       # 글로벌 스타일
```

## 라이선스

MIT License