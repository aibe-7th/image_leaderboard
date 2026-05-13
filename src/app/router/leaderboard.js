import express from "express";
import { getLeaderboardData } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const sort = req.query.sort || "latest"; // "latest" or "prompt"
    const challengeId = req.query.challenge_id; // 특정 챌린지 필터링
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    let sortBy = "created_at";
    if (sort === "prompt" || sort === "prompt_score") sortBy = "prompt_score";

    try {
        const { data, count, error } = await getLeaderboardData(sortBy, challengeId);
        
        if (error) throw error;

        // 메모리 내 페이징 (데이터가 적은 경우 효율적)
        const paginatedData = data.slice(offset, offset + limit);

        res.json({
            data: paginatedData,
            total: count,
            page,
            limit
        });
    } catch (err) {
        console.error("리더보드 조회 오류:", err);
        res.status(500).json({ error: "조회 실패" });
    }
});

export default router;
