# Supabase "Invalid API Key" 오류 해결 가이드

## 가능한 원인들:

### 1. 데이터베이스 스키마가 생성되지 않음
- `supabase-setup.sql` 파일의 SQL을 Supabase SQL Editor에서 실행했는지 확인
- `notes` 테이블이 실제로 생성되었는지 확인

### 2. RLS (Row Level Security) 정책 문제
- RLS가 활성화되어 있지만 적절한 정책이 없을 때 발생
- 다음 SQL로 RLS를 일시적으로 비활성화해서 테스트:
```sql
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
```

### 3. Supabase Authentication 설정
- Authentication → Settings에서 "Enable email confirmations" 비활성화
- Site URL에 올바른 도메인 추가

### 4. API 키 만료 또는 잘못된 키
- Settings → API에서 키를 다시 복사
- anon/public 키가 아닌 service_role 키를 사용하고 있는지 확인

## 즉시 시도할 수 있는 해결책:

### A. Authentication 이메일 확인 비활성화
Supabase 대시보드 → Authentication → Settings:
- "Enable email confirmations" 체크 해제
- "Enable phone confirmations" 체크 해제

### B. RLS 일시 비활성화
SQL Editor에서 실행:
```sql
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
```

### C. 새로운 API 키 생성
Settings → API → "Reset API Key" (필요시)