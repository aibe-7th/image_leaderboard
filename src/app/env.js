import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_URL) {
    console.error("❌ [Error] SUPABASE_URL이 .env 파일에 누락되었습니다.");
}
if (!process.env.CHALLENGE_PASS) {
    console.warn("⚠️ [Warning] CHALLENGE_PASS가 .env 파일에 누락되었습니다.");
}
