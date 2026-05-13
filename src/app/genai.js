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

    const model = new ChatGoogleGenerativeAI({
        model: "gemma-4-31b-it",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.8,
        maxOutputTokens: 128, // 출력 토큰 제한
    });

    // 1. 최소화된 Structured Output 스키마 (글 설명 제거)
    const schema = z.object({
        score: z.number().min(0).max(50).describe("유사도 점수 (0~50, 소수점 활용 권장)")
    });

    const modelWithStructuredOutput = model.withStructuredOutput(schema);

    try {
        // 3회 실행하여 결과 수집 (Self-Consistency)
        const tasks = Array.from({ length: 3 }).map(() =>
            modelWithStructuredOutput.invoke([
                ["system", "당신은 프롬프트 유사도 평가 전문가입니다. 정답과 사용자의 프롬프트를 비교하여 0~50점 사이의 점수만 산출하세요. 별도의 설명은 필요 없습니다."],
                ["human", `정답 프롬프트: ${finalTargetAnswer}\n사용자 프롬프트: ${userPrompt}`]
            ])
        );

        const results = await Promise.all(tasks);
        
        // 유효한 점수 추출
        const validScores = results
            .map(r => typeof r.score === 'number' ? r.score : null)
            .filter(s => s !== null);

        if (validScores.length === 0) return 0;

        // 평균 계산
        let avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;

        // 2. 출력 기반 정규표현식 스크리닝 (최종 점수 확정 전 검사)
        const badPatterns = [
            /[^a-zA-Z0-9가-힣\s,.]/g,
            /(.)\1{4,}/,
            /fuck|shit|damn/i
        ];

        if (badPatterns.some(regex => regex.test(userPrompt))) {
            console.warn(`[Post-Screening] 부적절한 패턴 감지됨, 점수 0점 처리: ${userPrompt}`);
            avgScore = 0;
        }

        console.log(`AI Scoring [${userPrompt}] - Raw Scores:`, validScores, "Final:", avgScore.toFixed(2));
        
        return parseFloat(avgScore.toFixed(2));
    } catch (error) {
        console.error("AI 점수 계산 중 오류 발생:", error);
        return 0;
    }
}
