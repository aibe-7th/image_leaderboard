import express from "express";
import { getLeaderboardData } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const sortParam = req.query.sort;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    let sortBy = "created_at";
    if (sortParam === "prompt") sortBy = "prompt_score";
    else if (sortParam === "image") sortBy = "image_score";

    const { data, error, count } = await getLeaderboardData(sortBy);

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

    const paginatedData = data.slice(offset, offset + limit);

    res.json({
        data: paginatedData,
        total: count || 0,
        page,
        limit
    });
});

export default router;
