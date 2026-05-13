import express from "express";
import multer from "multer";
import { uploadImageToStorage, insertLeaderboardData, getLeaderboardData } from "./db.js";
import { optimizeImage } from "./util.js";

const router = express.Router();

// multer 메모리 스토리지 설정
const upload = multer({ storage: multer.memoryStorage() });

// 리더보드 제출 엔드포인트
router.post("/submit", upload.single("image_file"), async (req, res) => {
    const { name, prompt, prompt_score, image_score } = req.body;
    const file = req.file;

    if (!name || !file || !prompt) {
        return res.status(400).json({ error: "name, image_file, prompt는 필수입니다." });
    }

    try {
        // 이미지 최적화 (util.js)
        const { optimizedImageBuffer, fileName } = await optimizeImage(file.buffer);

        // Supabase 스토리지 업로드 (db.js)
        const { error: storageError } = await uploadImageToStorage(fileName, optimizedImageBuffer);

        if (storageError) {
            console.error("스토리지 업로드 오류:", storageError.message);
            return res.status(500).json({ error: "이미지 업로드 실패" });
        }

        // 스토리지에 저장된 파일명을 DB에 저장
        const image_name = fileName;

        const { data, error } = await insertLeaderboardData({ 
            name, image_name, prompt, prompt_score, image_score 
        });

        if (error) {
            console.error("Supabase DB 삽입 오류:", error.message);
            return res.status(500).json({ error: "데이터 저장 실패" });
        }

        res.status(201).json({ message: "저장 완료", data });
    } catch (err) {
        console.error("서버 오류:", err.message || err);
        const status = err.message === "최적화 후에도 이미지가 1MB를 초과합니다." ? 400 : 500;
        res.status(status).json({ error: err.message || "서버 처리 중 오류 발생" });
    }
});

// 리더보드 조회 엔드포인트
router.get("/leaderboard", async (req, res) => {
    const sortParam = req.query.sort;
    const sortBy = sortParam === "prompt" ? "prompt_score" : "image_score";

    const { data, error } = await getLeaderboardData(sortBy);

    if (error) {
        return res.status(500).json({ error: "데이터 조회 실패" });
    }

    res.json(data);
});

export default router;
