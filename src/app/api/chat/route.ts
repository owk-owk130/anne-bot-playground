import type { CoreMessage } from "ai";
import { mastra } from "~/mastra";
import { imageAnalysisWorkflow } from "~/mastra/workflows";

const analyzeImageWithWorkflow = async (
  imageDataUrl: string,
  userPrompt?: string
) => {
  try {
    const workflowRun = imageAnalysisWorkflow.createRun();
    const workflowResult = await workflowRun.start({
      inputData: { imageDataUrl, userPrompt }
    });

    const catStepResult = workflowResult.steps.catResponse;

    return catStepResult?.status === "success"
      ? catStepResult.output?.text
      : "画像の分析に失敗しました";
  } catch (error) {
    console.error("ワークフロー実行エラー:", error);
    throw error;
  }
};

const streamCatAgent = async (
  messages: CoreMessage[],
  threadId: string,
  userId?: string
) => {
  const resourceId = userId
    ? `catAgent:${userId}`
    : `catAgent:guest:${threadId}`;
  const catAgent = mastra.getAgent("catAgent");
  return catAgent.stream(messages, { threadId, resourceId });
};

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || "default-session";
    const userId = url.searchParams.get("userId") || undefined;

    // ゲストユーザーの場合は空の履歴を返す
    if (!userId || sessionId.startsWith("guest-session-")) {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const catAgent = mastra.getAgent("catAgent");
    const agentMemory = catAgent.getMemory();
    if (!agentMemory) {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const resourceId = `catAgent:${userId}`;
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
        const catResponse = await analyzeImageWithWorkflow(
          imageDataUrl,
          userText || undefined
        );

        const catAgent = mastra.getAgent("catAgent");
        const resourceId = userId
          ? `catAgent:${userId}`
          : `catAgent:guest:${sessionId}`;
        const agentMemory = catAgent.getMemory();

        if (agentMemory && userId) {
          // 認証済みユーザーのみメモリに保存
          await agentMemory.addMessage({
            threadId: sessionId,
            resourceId,
            content: userText || "画像を分析してください",
            role: "user",
            type: "text"
          });

          await agentMemory.addMessage({
            threadId: sessionId,
            resourceId,
            content: catResponse,
            role: "assistant",
            type: "text"
          });
        }

        return new Response(
          new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              controller.enqueue(
                encoder.encode(
                  `0:"${catResponse.replace(/"/g, '\\"').replace(/\n/g, "\\n")}"\n`
                )
              );
              controller.close();
            }
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "X-Vercel-AI-Data-Stream": "v1"
            }
          }
        );
      } catch (error) {
        console.error("画像分析エラー:", error);
        const errorMessages: CoreMessage[] = [
          ...messages.slice(0, -1),
          {
            role: "user",
            content: userText || "画像を分析してください"
          },
          {
            role: "assistant",
            content: `画像の分析に失敗しました: ${error instanceof Error ? error.message : String(error)}`
          }
        ];
        const stream = await streamCatAgent(errorMessages, sessionId, userId);
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
