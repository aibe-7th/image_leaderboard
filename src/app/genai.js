import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

/**
 * Gemma 4 26B를 사용하여 프롬프트 유사도 점수 계산 (0~50점)
 * Self-Consistency (3회 반복 후 평균) 적용
 */
export async function calculatePromptScore(userPrompt, targetAnswer) {
    const finalTargetAnswer = targetAnswer || process.env.TODAY_ANSWER || "사막 위를 헤엄치는 투명 유리 고래와 노을빛 먼지 폭풍";

    // 1. 정규표현식 스크리닝 (부적절한 패턴 또는 무의미한 문자열 필터링)
    const badPatterns = [
        /[^a-zA-Z0-9가-힣\s,.]/g, // 허용되지 않는 특수문자 (간단한 예시)
        /(.)\1{4,}/,             // 동일 문자 5회 이상 반복 (예: aaaaa)
        /fuck|shit|damn/i       // 기본적인 금지어 (확장 가능)
    ];

    if (badPatterns.some(regex => regex.test(userPrompt))) {
        console.warn(`[Screening] 부적절한 프롬프트 감지됨: ${userPrompt}`);
        return 0; // 스크리닝 위반 시 즉시 0점 처리
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
        return parseFloat((Math.random() * 50).toFixed(2));
    }

    const model = new ChatGoogleGenerativeAI({
        model: "gemma-4-31b-it",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.8, // 다양성 확보를 위해 약간 높임
    });

    // 2. 고도화된 Structured Output 스키마 정의
    const schema = z.object({
        score: z.number().min(0).max(50).describe("유사도 점수 (0~50, 소수점 활용 권장)"),
        similarity_analysis: z.string().describe("정답과 사용자 프롬프트 간의 키워드 및 맥락 일치도 분석")
    });

    const modelWithStructuredOutput = model.withStructuredOutput(schema);

    try {
        // 3회 실행하여 결과 수집 (Self-Consistency)
        const tasks = Array.from({ length: 3 }).map(() =>
            modelWithStructuredOutput.invoke([
                ["system", `당신은 프롬프트 유사도 평가 전문가입니다. 
다음 기준에 따라 사용자의 프롬프트를 정교하게 평가해 주세요:
1. 키워드 일치성: 핵심 명사와 형용사가 얼마나 일치하는가?
2. 맥락적 유사성: 전체적인 분위기와 상황 묘사가 얼마나 유사한가?

최종 점수는 0~50점 사이에서 소수점 둘째 자리까지 부여하세요.`],
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

        console.log(`AI Scoring [${userPrompt}] - Raw Scores:`, validScores, "Final:", avgScore.toFixed(2));
        if (results[0]) console.log(`[Analysis]: ${results[0].similarity_analysis}`);

        return parseFloat(avgScore.toFixed(2));
    } catch (error) {
        console.error("AI 점수 계산 중 오류 발생:", error);
        return 0;
    }
}
