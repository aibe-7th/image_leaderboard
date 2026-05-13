import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Supabase 클라이언트 (서버에서만 key 사용)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SK
);

// 리더보드 제출 엔드포인트
router.post("/submit", async (req, res) => {
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
router.get("/leaderboard", async (req, res) => {
    const sortParam = req.query.sort;
    const sortBy = sortParam === "prompt" ? "prompt_score" : "image_score";

    const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order(sortBy, { ascending: false });

    if (error) {
        return res.status(500).json({ error: "데이터 조회 실패" });
    }

    res.json(data);
});

export default router;
