import { mastra } from "~/mastra";
import { imageAnalysisWorkflow } from "~/mastra/workflows";

const analyzeImageWithWorkflow = async (imageDataUrl: string) => {
  const workflowRun = imageAnalysisWorkflow.createRun();
  const workflowResult = await workflowRun.start({
    inputData: { imageDataUrl }
  });
  const catStepResult = workflowResult.steps.catResponse;
  return catStepResult?.status === "success"
    ? catStepResult.output?.text
    : "画像の分析に失敗しました";
};

const streamCatAgent = async (role: "assistant" | "user", content: string) => {
  const catAgent = mastra.getAgent("catAgent");
  return catAgent.stream([{ role, content }]);
};

export const POST = async (req: Request) => {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const imageDataMatch = lastMessage.content.match(
      /画像データ:\s*(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/
    );
    const hasImageData = imageDataMatch !== null;

    if (hasImageData) {
      const imageDataUrl = imageDataMatch[1];
      try {
        const finalText = await analyzeImageWithWorkflow(imageDataUrl);
        const stream = await streamCatAgent("assistant", finalText);
        return stream.toDataStreamResponse();
      } catch (workflowError) {
        console.error("Workflow error:", workflowError);
        const stream = await streamCatAgent("user", "画像の分析に失敗しました");
        return stream.toDataStreamResponse();
      }
    }

    const stream = await streamCatAgent("user", JSON.stringify(messages));
    return stream.toDataStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
