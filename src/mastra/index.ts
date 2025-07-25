import { ConsoleLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { catAgent, imageAnalysisAgent } from "~/mastra/agents";
import { imageAnalysisWorkflow } from "~/mastra/workflows";

export const mastra = new Mastra({
  agents: { catAgent, imageAnalysisAgent },
  workflows: { imageAnalysisWorkflow },
  logger: new ConsoleLogger({
    name: "Mastra",
    level: "info",
  }),
});
