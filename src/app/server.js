import "./env.js";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import apiRouter from "./router/index.js";
import { getOpenChallenges, getLeaderboardData } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "../public")));

// SSR 메인 페이지 (목록)
app.get("/", async (req, res) => {
    try {
        const { data: challenges } = await getOpenChallenges();
        res.render("index", { challenges: challenges || [] });
    } catch (err) {
        console.error("SSR 메인 페이지 렌더링 오류:", err);
        res.status(500).send("Internal Server Error");
    }
});

// SSR 챌린지 상세 페이지
app.get("/challenge/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { data: challenge } = await getChallengeById(id);
        
        if (!challenge) {
            return res.status(404).send("챌린지를 찾을 수 없습니다.");
        }

        const { data: leaderboard } = await getLeaderboardData("prompt_score", id);
        res.render("challenge", { challenge, leaderboard: leaderboard || [] });
    } catch (err) {
        console.error("SSR 상세 페이지 렌더링 오류:", err);
        res.status(500).send("Internal Server Error");
    }
});

// SSR 어드민 페이지
app.get("/admin", (req, res) => {
    res.render("admin");
});

// API 라우터 등록
app.use("/api", apiRouter);

const PORT = Number(process.env.PORT) || 3000;
const RENDER = process.env.RENDER;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

app.listen(PORT, () => {
    console.log(`현재 작동 포트 : ${PORT}`)
    if (RENDER) {
        console.log(`RENDER에서 구동 중 : ${RENDER_EXTERNAL_URL}`);
    } else {
        console.log(`로컬에서 구동 중 : http://localhost:${PORT}`);
    }
});

export default app;