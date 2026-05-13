import express from "express";
import multer from "multer";
import { uploadImageToStorage, insertChallenge } from "../db.js";
import { optimizeImage } from "../util.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 인증 미들웨어 (세션 검증)
const adminAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: "세션이 만료되었거나 권한이 없습니다." });
    }
};

// 로그인 API
router.post("/login", (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.CHALLENGE_PASS;

    console.log("[Admin Login Attempt] Body Keys:", Object.keys(req.body || {}));

    if (!password || !adminPass) {
        console.warn("[Admin] 로그인 시도 실패: 데이터 누락", { 
            hasPassword: !!password, 
            hasAdminPass: !!adminPass 
        });
        return res.status(400).json({ error: "비밀번호를 입력하세요." });
    }

    // 문자열로 변환 및 공백 제거 후 비교 (타입 불일치 방지)
    if (String(password).trim() === String(adminPass).trim()) {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessions.add(token);
        console.log("[Admin] 로그인 성공");
        res.json({ message: "로그인 성공", token });
    } else {
        console.warn("[Admin] 로그인 실패: 비밀번호 불일치");
        res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
    }
});

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
