import express from "express";
import multer from "multer";
import { uploadImageToStorage, insertLeaderboardData, checkDuplicatePrompt } from "../db.js";
import { optimizeImage, maskIp } from "../util.js";
import { calculatePromptScore } from "../genai.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image_file"), async (req, res) => {
    const { name, prompt } = req.body;
    const file = req.file;

    if (!name || !file || !prompt) {
        return res.status(400).json({ error: "name, image_file, prompt는 필수입니다." });
    }

    if (prompt.length < 10 || prompt.length > 50) {
        return res.status(400).json({ error: "프롬프트는 10~50자 사이로 입력해야 합니다." });
    }

    if (name.length > 10) {
        return res.status(400).json({ error: "이름은 한글 기준 10자를 초과할 수 없습니다." });
    }

    try {
        // 중복 프롬프트 확인
        const { exists, error: checkError } = await checkDuplicatePrompt(prompt);
        if (checkError) {
            console.error("중복 확인 중 오류:", checkError.message);
            return res.status(500).json({ error: "중복 확인 실패" });
        }
        if (exists) {
            return res.status(400).json({ error: "이미 동일한 프롬프트가 존재합니다. 자신만의 독창적인 프롬프트를 입력해 주세요!" });
        }

        // AI를 사용한 프롬프트 유사도 점수 계산 (0~50)
        const targetAnswer = process.env.TODAY_ANSWER;
        const prompt_score = await calculatePromptScore(prompt, targetAnswer);

        // 이미지 점수 (0~50 사이 랜덤 부여)
        const image_score = parseFloat((Math.random() * 49 + 1).toFixed(2));

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
        const userIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        const maskedIp = maskIp(userIp);

        const { data, error } = await insertLeaderboardData({
            name, image_name, prompt, prompt_score, image_score, ip: maskedIp
        });

        if (error) {
            console.error("Supabase DB 삽입 오류:", error.message);
            return res.status(500).json({ error: "데이터 저장 실패" });
        }

        res.status(201).json({ message: "저장 완료", data });
    } catch (err) {
        console.error("서버 오류 상세:", err);
        const status = err.message === "최적화 후에도 이미지가 1MB를 초과합니다." ? 400 : 500;
        res.status(status).json({ error: err.message || "서버 처리 중 오류 발생" });
    }
});

export default router;
