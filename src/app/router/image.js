import express from "express";
import { getImageFromStorage } from "../db.js";

const router = express.Router();

router.get("/:filename", async (req, res) => {
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

export default router;
