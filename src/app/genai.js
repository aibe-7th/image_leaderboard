import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

/**
 * Gemma 4 26B를 사용하여 프롬프트 유사도 점수 계산 (0~50점)
 * Self-Consistency (3회 반복 후 평균) 적용
 */
export async function calculatePromptScore(userPrompt, targetAnswer) {
    const finalTargetAnswer = targetAnswer || process.env.TODAY_ANSWER || "사막 위를 헤엄치는 투명 유리 고래와 노을빛 먼지 폭풍";

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
        return 0;
    }

    // 1. 최소화된 Structured Output 스키마
    const schema = z.object({
        score: z.number().min(0).max(50).describe("유사도 점수 (0~50)")
    });

    // 모델 호출 내부 함수
    const _invokeModel = async (modelName) => {
        const model = new ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.8,
            maxOutputTokens: 128,
        });
        const modelWithStructuredOutput = model.withStructuredOutput(schema);

        const tasks = Array.from({ length: 3 }).map(() =>
            modelWithStructuredOutput.invoke([
                ["system", "당신은 프롬프트 유사도 평가 전문가입니다. 정답과 사용자의 프롬프트를 비교하여 0~50점 사이의 점수만 산출하세요. 별도의 설명은 필요 없습니다."],
                ["human", `정답 프롬프트: ${finalTargetAnswer}\n사용자 프롬프트: ${userPrompt}`]
            ])
        );
        return await Promise.all(tasks);
    };

    try {
        let results;
        try {
            // 메인 모델 시도
            results = await _invokeModel("gemma-4-31b-it");
        } catch (primaryError) {
            console.warn(`[Fallback] 메인 모델 오류, 폴백 모델 시도: ${primaryError.message}`);
            // 폴백 모델 시도
            results = await _invokeModel("gemma-4-26b-a4b-it");
        }
        
        // 유효한 점수 추출
        const validScores = results
            .map(r => typeof r.score === 'number' ? r.score : null)
            .filter(s => s !== null);

        if (validScores.length === 0) return 0;

        // 평균 계산
        const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;

        console.log(`AI Scoring [${userPrompt}] - Raw Scores:`, validScores, "Final:", avgScore.toFixed(2));
        
        return parseFloat(avgScore.toFixed(2));
    } catch (error) {
        console.error("AI 채점 최종 실패 (모든 모델 실패):", error);
        return 0;
    }
}
