import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

/**
 * Gemini 2.0 Flash Lite를 사용하여 프롬프트 유사도 점수 계산 (0~50점)
 * Self-Consistency (5회 반복 후 평균) 적용
 */
export async function calculatePromptScore(userPrompt, targetAnswer) {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY가 설정되지 않았습니다.");
        return Math.floor(Math.random() * 51); // 폴백: 랜덤 점수
    }

    const model = new ChatGoogleGenerativeAI({
        modelName: "gemini-2.5-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0.7,
    });

    const parser = StructuredOutputParser.fromZodSchema(
        z.object({
            score: z.number().min(0).max(50).describe("유사도 점수 (0~50)"),
            reason: z.string().describe("점수 부여 이유")
        })
    );

    const promptTemplate = new PromptTemplate({
        template: `
당신은 이미지 생성 프롬프트의 유사도를 평가하는 전문가입니다.
제공된 '정답 프롬프트'와 '사용자 프롬프트'를 비교하여 의미적, 맥락적 유사도를 0점에서 50점 사이로 평가해 주세요.

- 정답 프롬프트: {answer}
- 사용자 프롬프트: {user_prompt}

{format_instructions}
        `,
        inputVariables: ["answer", "user_prompt"],
        partialVariables: { format_instructions: parser.getFormatInstructions() },
    });

    const chain = promptTemplate.pipe(model).pipe(parser);

    try {
        // 5회 실행하여 결과 수집 (Self-Consistency)
        const tasks = Array.from({ length: 5 }).map(() =>
            chain.invoke({ answer: targetAnswer, user_prompt: userPrompt })
        );

        const results = await Promise.all(tasks);

        // 점수 추출 및 평균 계산
        const scores = results.map(r => r.score);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        console.log(`AI Scoring Results (${targetAnswer} vs ${userPrompt}):`, scores, "Avg:", avgScore);

        return parseFloat(avgScore.toFixed(2));
    } catch (error) {
        console.error("AI 점수 계산 중 오류 발생:", error);
        return Math.floor(Math.random() * 51); // 오류 시 랜덤 폴백
    }
}
