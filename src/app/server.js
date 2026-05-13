import "./env.js";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import apiRouter from "./router/index.js";
import { getOpenChallenges, getLeaderboardData, getChallengeById, getChallengeParticipantCounts } from "./db.js";

import session from "express-session";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// 세션 설정
app.use(session({
    secret: process.env.CHALLENGE_PASS || "secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !!process.env.RENDER } // Render 배포 환경(HTTPS)에서만 true 적용
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 공통 변수 설정 (Base URL)
app.use((req, res, next) => {
    const protocol = process.env.RENDER ? "https" : req.protocol;
    const host = process.env.RENDER_EXTERNAL_URL || req.get("host");
    res.locals.baseUrl = `${protocol}://${host}`;
    next();
});

// 정적 파일 서빙 (CSS, JS, Images)
app.use(express.static(path.join(__dirname, "../public")));

// SSR 메인 페이지 (목록)
app.get("/", async (req, res) => {
    try {
        const { data: challenges } = await getOpenChallenges();
        const challengeIds = (challenges || []).map(c => c.id);
        const participantCounts = await getChallengeParticipantCounts(challengeIds);

        res.render("index", { 
            challenges: challenges || [],
            participantCounts: participantCounts || {}
        });
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
    if (req.session.isAdmin) {
        res.render("admin");
    } else {
        res.render("admin_login", { error: null });
    }
});

// 어드민 로그인 처리
app.post("/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.CHALLENGE_PASS || "admin123";

    if (password === adminPass) {
        req.session.isAdmin = true;
        res.redirect("/admin");
    } else {
        res.render("admin_login", { error: "비밀번호가 올바르지 않습니다." });
    }
});

// 어드민 로그아웃
app.get("/admin/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/admin");
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