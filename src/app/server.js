import 'dotenv/config';
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// https://render.com/docs/environment-variables
const PORT = Number(process.env.PORT);
if (!PORT) throw new Error("PORT가 감지 되지 않음");

const RENDER = process.env.RENDER;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

// Supabase 클라이언트 (서버에서만 key 사용)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SK
);

// 정적 파일 서빙 (public/ 폴더)
app.use(express.static(path.join(__dirname, "../public")));

// 리더보드 제출 엔드포인트
app.post("/api/submit", async (req, res) => {
    const { name, image_name, prompt, prompt_score, image_score } = req.body;

    if (!name || !image_name || !prompt) {
        return res.status(400).json({ error: "name, image_name, prompt는 필수입니다." });
    }

    const { data, error } = await supabase
        .from("leaderboard")
        .insert([{ name, image_name, prompt, prompt_score, image_score }])
        .select()
        .single();

    if (error) {
        console.error("Supabase 삽입 오류:", error.message);
        return res.status(500).json({ error: "데이터 저장 실패" });
    }

    res.status(201).json({ message: "저장 완료", data });
});

// 리더보드 조회 엔드포인트
app.get("/api/leaderboard", async (_, res) => {
    const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("image_score", { ascending: false });

    if (error) {
        return res.status(500).json({ error: "데이터 조회 실패" });
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`현재 작동 포트 : ${PORT}`)
    if (RENDER) {
        console.log(`RENDER에서 구동 중 : ${RENDER_EXTERNAL_URL}`);
    } else {
        console.log(`로컬에서 구동 중 : http://localhost:${PORT}`);
    }
});

export default app;