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

    // 1. 최소화된 Structured Output 스키마 (사용자 요청에 따라 reason 제거)
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
                ["system", "당신은 프롬프트 유사도 평가 전문가입니다. 정답과 사용자의 프롬프트 간의 의미론적 유사성, 키워드 일치도, 분위기 및 스타일 재현력을 엄격하게 평가하여 0.00~50.00점 사이의 점수를 산출하세요. 변별력을 높이기 위해 소수점 둘째 자리까지 정밀하게 평가해야 하며, 아주 미세한 차이도 점수에 반영하세요. 별도의 설명 없이 숫자(점수)만 포함된 JSON을 반환하세요."],
                ["human", `정답 프롬프트: ${finalTargetAnswer}\n사용자 프롬프트: ${userPrompt}`]
            ])
        );
        return await Promise.all(tasks);
    };

    const modelsToTry = ["gemma-4-31b-it", "gemma-4-26b-a4b-it"];
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
        return 0;
    }
        
    // 유효한 점수 추출
    const validScores = results
        .map(r => typeof r.score === 'number' ? r.score : null)
        .filter(s => s !== null);

    if (validScores.length === 0) return 0;

    // 평균 계산
    const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;

    console.log(`AI Scoring [${userPrompt}] - Final Score: ${avgScore.toFixed(2)}`);
    
    return parseFloat(avgScore.toFixed(2));
}
