import express from "express";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import sharp from "sharp";

const router = express.Router();

// multer 메모리 스토리지 설정
const upload = multer({ storage: multer.memoryStorage() });

// Supabase 클라이언트 (서버에서만 key 사용)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SK
);

// 리더보드 제출 엔드포인트
router.post("/submit", upload.single("image_file"), async (req, res) => {
    const { name, prompt, prompt_score, image_score } = req.body;
    const file = req.file;

    if (!name || !file || !prompt) {
        return res.status(400).json({ error: "name, image_file, prompt는 필수입니다." });
    }

    try {
        // 이미지 최적화 (1MB 이하로 맞추기 위해 리사이징 및 WebP 변환)
        const optimizedImageBuffer = await sharp(file.buffer)
            .resize({ width: 1024, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        if (optimizedImageBuffer.length > 1024 * 1024) {
            return res.status(400).json({ error: "최적화 후에도 이미지가 1MB를 초과합니다." });
        }

        const fileName = `${Date.now()}_${Math.round(Math.random() * 1E9)}.webp`;

        // Supabase 스토리지 업로드
        const { data: storageData, error: storageError } = await supabase.storage
            .from("genai_image")
            .upload(fileName, optimizedImageBuffer, {
                contentType: "image/webp"
            });

        if (storageError) {
            console.error("스토리지 업로드 오류:", storageError.message);
            return res.status(500).json({ error: "이미지 업로드 실패" });
        }

        // 스토리지에 저장된 파일명을 DB에 저장
        const image_name = fileName;

        const { data, error } = await supabase
            .from("leaderboard")
            .insert([{ name, image_name, prompt, prompt_score, image_score }])
            .select()
            .single();

        if (error) {
            console.error("Supabase DB 삽입 오류:", error.message);
            return res.status(500).json({ error: "데이터 저장 실패" });
        }

        res.status(201).json({ message: "저장 완료", data });
    } catch (err) {
        console.error("서버 오류:", err);
        res.status(500).json({ error: "서버 처리 중 오류 발생" });
    }
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
