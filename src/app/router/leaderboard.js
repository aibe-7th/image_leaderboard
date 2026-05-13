import express from "express";
import { getLeaderboardData } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const sortParam = req.query.sort;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    let sortBy = "prompt_score";
    if (sortParam === "latest") sortBy = "created_at";

    const { data, error, count } = await getLeaderboardData(sortBy);

    if (error) {
        return res.status(500).json({ error: "데이터 조회 실패" });
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
