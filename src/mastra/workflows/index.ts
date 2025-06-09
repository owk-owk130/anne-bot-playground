import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { imageAnalysisAgent, catAgent } from "~/mastra/agents";

const parseAnalysisResult = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("JSON解析エラー:", e);
  }
  return { isCat: false, analysis: "画像の分析に失敗しました" };
};

const analyzeImageStep = createStep({
  id: "analyzeImage",
  inputSchema: z.object({
    imageDataUrl: z.string(),
    userPrompt: z.string().optional(),
  }),
  outputSchema: z.object({
    analysis: z.object({
      isCat: z.boolean(),
      analysis: z.string(),
    }),
  }),
  execute: async ({ inputData }) => {
    const prompt = inputData.userPrompt || "この画像を詳細に分析してください。";
    const analysisResult = await imageAnalysisAgent.generate([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: inputData.imageDataUrl },
        ],
      },
    ]);
    return {
      analysis: parseAnalysisResult(analysisResult.text),
    };
  },
});

const catResponseStep = createStep({
  id: "catResponse",
  inputSchema: z.object({
    analysis: z.object({
      isCat: z.boolean(),
      analysis: z.string(),
    }),
  }),
  outputSchema: z.object({
    text: z.string(),
  }),
  execute: async ({ inputData }) => {
    const catResult = await catAgent.generate([
      {
        role: "user",
        content: `画像分析結果: ${JSON.stringify(inputData.analysis)}`,
      },
    ]);
    return {
      text: catResult.text,
    };
  },
});

export const imageAnalysisWorkflow = createWorkflow({
  id: "imageAnalysis",
  inputSchema: z.object({
    imageDataUrl: z.string(),
    userPrompt: z.string().optional(),
  }),
  outputSchema: z.object({
    text: z.string(),
  }),
})
  .then(analyzeImageStep)
  .then(catResponseStep)
  .commit();
