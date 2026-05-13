import 'dotenv/config';
import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// https://render.com/docs/environment-variables
const PORT = Number(process.env.PORT);
if (!PORT) throw new Error("PORT가 감지 되지 않음");

const RENDER = process.env.RENDER;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

// 정적 파일 서빙 (public/ 폴더)
app.use(express.static(path.join(__dirname, "../public")));

app.listen(PORT, () => {
    console.log(`현재 작동 포트 : ${PORT}`)
    if (RENDER) {
        console.log(`RENDER에서 구동 중 : ${RENDER_EXTERNAL_URL}`);
    } else {
        console.log(`로컬에서 구동 중 : http://localhost:${PORT}`);
    }
});

export default app;