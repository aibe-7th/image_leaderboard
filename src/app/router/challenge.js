import { getOpenChallenges } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { data, error } = await getOpenChallenges();
    
    if (error) {
        return res.status(500).json({ error: "챌린지 정보 조회 실패" });
    }

    res.json({ challenges: data });
});

export default router;
