import express from "express";
import submitRouter from "./submit.js";
import leaderboardRouter from "./leaderboard.js";
import imageRouter from "./image.js";
import challengeRouter from "./challenge.js";

const router = express.Router();

router.use("/submit", submitRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/image", imageRouter);
router.use("/challenge", challengeRouter);

export default router;
