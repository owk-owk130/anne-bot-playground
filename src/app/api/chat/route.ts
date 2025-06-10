import type { CoreMessage } from "ai";
import { mastra } from "~/mastra";
import { imageAnalysisWorkflow } from "~/mastra/workflows";

const analyzeImageWithWorkflow = async (
  imageDataUrl: string,
  userPrompt?: string
) => {
  const workflowRun = imageAnalysisWorkflow.createRun();
  const workflowResult = await workflowRun.start({
    inputData: { imageDataUrl, userPrompt }
  });
  const catStepResult = workflowResult.steps.catResponse;
  return catStepResult?.status === "success"
    ? catStepResult.output?.text
    : "画像の分析に失敗しました";
};

const streamCatAgent = async (
  messages: CoreMessage[],
  threadId: string,
  userId?: string
) => {
  const resourceId = userId ? `catAgent:${userId}` : "catAgent";
  const catAgent = mastra.getAgent("catAgent");
  return catAgent.stream(messages, { threadId, resourceId });
};

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || "default-session";
    const userId = url.searchParams.get("userId") || undefined;
    const catAgent = mastra.getAgent("catAgent");
    const agentMemory = catAgent.getMemory();
    if (!agentMemory) {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const resourceId = userId ? `catAgent:${userId}` : "catAgent";
    const messageHistory = await agentMemory.rememberMessages({
      threadId: sessionId,
      resourceId
    });
    return new Response(
      JSON.stringify({ messages: messageHistory.uiMessages }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch {
    return new Response(JSON.stringify({ messages: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const POST = async (req: Request) => {
  try {
    const { messages } = await req.json();
    const sessionId = req.headers.get("x-session-id") || "default-session";
    const userId = req.headers.get("x-user-id") || undefined;
    const lastMessage = messages[messages.length - 1];
    const imageDataMatch = lastMessage.content.match(
      /画像データ:\s*(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/
    );
    if (imageDataMatch) {
      const imageDataUrl = imageDataMatch[1];
      const userText = lastMessage.content
        .replace(/\s*\[img-\d+\]/, "")
        .replace(
          /\n\n画像データ:\s*data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
          ""
        )
        .trim();
      try {
        const finalText = await analyzeImageWithWorkflow(
          imageDataUrl,
          userText || undefined
        );
        const stream = await streamCatAgent(
          [
            {
              role: "user",
              content: "この画像を分析して"
              // content: lastMessage.content
            }
            // {
            //   role: "assistant",
            //   content: finalText
            // }
          ],
          sessionId,
          userId
        );
        return stream.toDataStreamResponse();
      } catch {
        const stream = await streamCatAgent(
          [
            { role: "user", content: lastMessage.content },
            { role: "assistant", content: "画像の分析に失敗しました" }
          ],
          sessionId,
          userId
        );
        return stream.toDataStreamResponse();
      }
    }
    const stream = await streamCatAgent(messages, sessionId, userId);
    return stream.toDataStreamResponse();
  } catch (error) {
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

export const DELETE = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
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
