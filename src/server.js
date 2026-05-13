import 'dotenv/config';
import express from "express";

const app = express();

// https://render.com/docs/environment-variables
const PORT = Number(process.env.PORT);
if (!PORT) throw new Error("PORT가 감지 되지 않음");

const RENDER = process.env.RENDER;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

app.get("/healthz", (_, res) => {
    res.status(200).send("ok");
});

app.get("/", (_, res) => {
    res.send("Render(Docker) + Express(Nodemon)");
});

app.listen(PORT, () => {
    console.log(`현재 작동 포트 : ${PORT}`)
    if (RENDER) {
        console.log(`RENDER에서 구동 중 : ${RENDER_EXTERNAL_URL}`);
    } else {
        console.log(`로컬에서 구동 중 : http://localhost:${PORT}`);
    }

});

export default app;