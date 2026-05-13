# Image Leaderboard

AI 이미지 생성 프롬프트 맞추기 챌린지 및 리더보드 시스템입니다.

## 로컬 실행
```sh
npm i
npm run dev
```

## 배포 가이드 (Render)

Gemini API 및 Gemma 모델 사용 시 지역 제한(`User location is not supported`) 오류를 방지하기 위해 반드시 아래 지역으로 설정하여 배포하시기 바랍니다.

- **Region**: `Oregon (US West)`

## 환경 변수 설정
- `PORT`: 서비스 포트 (기본 3000)
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키
- `GEMINI_API_KEY`: Google Gemini API 키
- `ADMIN_PASS`: 관리자 페이지 접속 비밀번호
- `RENDER_EXTERNAL_URL`: Render 외부 접속 URL (OG 이미지 생성용)