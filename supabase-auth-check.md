# Supabase Authentication 설정 확인 체크리스트

## 1. Supabase 대시보드에서 확인할 것들:

### Authentication 설정
1. **https://caxvdsccyclnzpyxcytf.supabase.co** 대시보드 접속
2. **Authentication** → **Settings** 이동
3. **Enable email confirmations** 설정 확인 (초기에는 끄는 것을 권장)
4. **Site URL** 설정 확인:
   - Development: `http://localhost:3000`
   - Production: 실제 Vercel 도메인

### API Keys 재확인
1. **Settings** → **API** 이동
2. **Project URL**이 정확한지 확인: `https://caxvdsccyclnzpyxcytf.supabase.co`
3. **anon public** 키가 현재 사용 중인 키와 일치하는지 확인

### Database 스키마 확인
1. **SQL Editor**에서 다음 쿼리 실행하여 notes 테이블이 존재하는지 확인:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'notes';
```

## 2. 로컬에서 디버깅

개발 서버를 실행하고 브라우저 개발자 도구에서 Network 탭을 확인하여 정확한 오류 메시지 확인