import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        todayImage: process.env.TODAY_IMAGE
    });
});

export default router;
