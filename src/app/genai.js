import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

/**
 * Gemini 2.5 Flash Lite를 사용하여 프롬프트 유사도 점수 계산 (0~50점)
 * Self-Consistency (5회 반복 후 평균) 적용
 */
export async function calculatePromptScore(userPrompt, targetAnswer) {
    const finalTargetAnswer = targetAnswer || process.env.TODAY_ANSWER || "사막 위를 헤엄치는 투명 유리 고래와 노을빛 먼지 폭풍";

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
        return parseFloat((Math.random() * 50).toFixed(2));
    }

    const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.8, // 다양성 확보를 위해 약간 높임
    });

    const schema = z.object({
        score: z.number().min(0).max(50).describe("유사도 점수 (0~50, 소수점 활용 권장)"),
        reason: z.string().describe("점수 부여 이유 (구체적 분석)")
    });

    const modelWithStructuredOutput = model.withStructuredOutput(schema);

    try {
        // 5회 실행하여 결과 수집 (Self-Consistency)
        const tasks = Array.from({ length: 5 }).map(() =>
            modelWithStructuredOutput.invoke([
                ["system", "당신은 이미지 생성 프롬프트의 유사도를 평가하는 전문가입니다. 정답과 사용자의 프롬프트를 의미적, 맥락적으로 비교하여 0~50점 사이로 평가하세요. 변별력을 위해 소수점 둘째 자리까지 정밀하게 점수를 부여하세요."],
                ["human", `정답 프롬프트: ${finalTargetAnswer}\n사용자 프롬프트: ${userPrompt}`]
            ])
        );

        const results = await Promise.all(tasks);
        
        // 유효한 점수 추출
        const validScores = results
            .map(r => typeof r.score === 'number' ? r.score : null)
            .filter(s => s !== null);

        if (validScores.length === 0) return 0;

        // 평균 계산 (소수점 2자리)
        const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;

        console.log(`AI Scoring Results [${userPrompt}]:`, validScores, "Final Avg:", avgScore.toFixed(2));
        
        return parseFloat(avgScore.toFixed(2));
    } catch (error) {
        console.error("AI 점수 계산 중 오류 발생:", error);
        return parseFloat((Math.random() * 50).toFixed(2));
    }
}
