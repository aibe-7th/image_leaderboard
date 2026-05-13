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

    // 1. Structured Output 스키마
    const schema = z.object({
        score: z.number().min(0).max(50).describe("유사도 점수 (0~50)"),
        reason: z.string().describe("채점 이유 (1~2문장)")
    });

    // 모델 호출 내부 함수
    const _invokeModel = async (modelName) => {
        const model = new ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.8,
            maxOutputTokens: 256,
        });
        const modelWithStructuredOutput = model.withStructuredOutput(schema);

        const tasks = Array.from({ length: 3 }).map(() =>
            modelWithStructuredOutput.invoke([
                ["system", "당신은 프롬프트 유사도 평가 전문가입니다. 정답과 사용자의 프롬프트를 비교하여 0~50점 사이의 점수와 그 이유를 산출하세요."],
                ["human", `정답 프롬프트: ${finalTargetAnswer}\n사용자 프롬프트: ${userPrompt}`]
            ])
        );
        return await Promise.all(tasks);
    };

    const modelsToTry = ["gemma-4-31b-it", "gemma-4-26b-a4b-it", "gemma-3-27b-it"];
    let results = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI Scoring] Attempting with model: ${modelName}`);
            results = await _invokeModel(modelName);
            if (results && results.length > 0) break; // 성공 시 루프 종료
        } catch (err) {
            console.warn(`[Fallback] ${modelName} 실패: ${err.message}`);
            lastError = err;
        }
    }

    if (!results) {
        console.error("AI 채점 최종 실패 (모든 모델 시도 실패):", lastError);
        return { score: 0, reason: "AI 채점 중 오류가 발생했습니다." };
    }
        
    // 유효한 점수 및 이유 추출
    const validResults = results.filter(r => typeof r.score === 'number');
    if (validResults.length === 0) return { score: 0, reason: "점수를 산출하지 못했습니다." };

    const avgScore = validResults.reduce((a, b) => a + b.score, 0) / validResults.length;
    const finalReason = validResults[0].reason || "유사도에 따라 점수가 산출되었습니다.";

    console.log(`AI Scoring [${userPrompt}] - Final Score: ${avgScore.toFixed(2)}, Reason: ${finalReason}`);
    
    return { 
        score: parseFloat(avgScore.toFixed(2)), 
        reason: finalReason 
    };
}
