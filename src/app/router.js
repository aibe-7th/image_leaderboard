import express from "express";
import multer from "multer";
import { uploadImageToStorage, insertLeaderboardData, getLeaderboardData, getImageFromStorage } from "./db.js";
import { optimizeImage } from "./util.js";

const router = express.Router();

// multer 메모리 스토리지 설정
const upload = multer({ storage: multer.memoryStorage() });

// 리더보드 제출 엔드포인트
router.post("/submit", upload.single("image_file"), async (req, res) => {
    const { name, prompt } = req.body;
    const file = req.file;

    if (!name || !file || !prompt) {
        return res.status(400).json({ error: "name, image_file, prompt는 필수입니다." });
    }

    if (prompt.length > 50) {
        return res.status(400).json({ error: "프롬프트는 한글 기준 50자를 초과할 수 없습니다." });
    }

    if (name.length > 10) {
        return res.status(400).json({ error: "이름은 한글 기준 10자를 초과할 수 없습니다." });
    }

    try {
        // 1~100 사이 랜덤 점수 부여 (소수점 둘째자리)
        const prompt_score = parseFloat((Math.random() * 99 + 1).toFixed(2));
        const image_score = parseFloat((Math.random() * 99 + 1).toFixed(2));
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
    let sortBy = "created_at";
    if (sortParam === "prompt") sortBy = "prompt_score";
    else if (sortParam === "image") sortBy = "image_score";

    const { data, error } = await getLeaderboardData(sortBy);

    if (error) {
        return res.status(500).json({ error: "데이터 조회 실패" });
    }

    // 총점 정렬인 경우 서버 메모리에서 직접 정렬
    if (sortParam === "total" && data) {
        data.sort((a, b) => {
            const totalA = Number(a.prompt_score) + Number(a.image_score);
            const totalB = Number(b.prompt_score) + Number(b.image_score);
            if (totalB !== totalA) {
                return totalB - totalA; // 내림차순
            }
            return new Date(b.created_at) - new Date(a.created_at); // 동점 시 최신순
        });
    }

    res.json(data);
});

// 이미지 서빙 엔드포인트
router.get("/image/:filename", async (req, res) => {
    const { filename } = req.params;

    const { data, error } = await getImageFromStorage(filename);

    if (error) {
        console.error("이미지 다운로드 실패:", error.message);
        return res.status(404).send("이미지를 찾을 수 없습니다.");
    }

    try {
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.set("Content-Type", data.type || "image/webp");
        res.set("Cache-Control", "public, max-age=31536000");
        res.send(buffer);
    } catch (err) {
        console.error("이미지 버퍼 변환 실패:", err);
        res.status(500).send("이미지 처리 중 오류 발생");
    }
});

// 오늘의 챌린지 정보 엔드포인트
router.get("/challenge", (req, res) => {
    res.json({
        todayImage: process.env.TODAY_IMAGE
    });
});

export default router;
