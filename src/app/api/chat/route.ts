import { mastra } from "~/mastra";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const myAgent = mastra.getAgent("catAgent");
  const stream = await myAgent.stream(messages);

  return stream.toDataStreamResponse();
}
