import { mastra } from "~/mastra";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("Received messages:", messages);
    const myAgent = mastra.getAgent("catAgent");
    const stream = await myAgent.stream(messages);
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
}
