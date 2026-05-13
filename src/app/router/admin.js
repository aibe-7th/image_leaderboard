import express from "express";
import multer from "multer";
import { uploadImageToStorage, insertChallenge } from "../db.js";
import { optimizeImage } from "../util.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 인증 미들웨어
const adminAuth = (req, res, next) => {
    const password = req.headers["admin-password"];
    if (password === process.env.CHALLENGE_PASS) {
        next();
    } else {
        res.status(401).json({ error: "권한이 없습니다." });
    }
};

// 챌린지 등록 API
router.post("/challenge", adminAuth, upload.single("image_file"), async (req, res) => {
    const { prompt, start_date, end_date, show_yn } = req.body;
    const file = req.file;

    if (!prompt || !file || !start_date || !end_date) {
        return res.status(400).json({ error: "필수 데이터가 누락되었습니다." });
    }

    try {
        // 이미지 최적화
        const { optimizedImageBuffer, fileName } = await optimizeImage(file.buffer);

        // 스토리지 업로드
        const { error: storageError } = await uploadImageToStorage(fileName, optimizedImageBuffer);
        if (storageError) throw storageError;

        // DB 저장
        const { data, error } = await insertChallenge({
            prompt,
            result_image: fileName,
            start_date,
            end_date,
            show_yn: show_yn || 'Y'
        });

        if (error) throw error;

        res.status(201).json({ message: "챌린지 등록 완료", data });
    } catch (err) {
        console.error("어드민 오류:", err);
        res.status(500).json({ error: "처리 중 오류 발생" });
    }
});

export default router;
