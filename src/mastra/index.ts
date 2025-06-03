import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { catAgent, imageAnalysisAgent } from "~/mastra/agents";
import { imageAnalysisWorkflow } from "~/mastra/workflows";

export const mastra = new Mastra({
  agents: { catAgent, imageAnalysisAgent },
  workflows: { imageAnalysisWorkflow },
  logger: createLogger({
    name: "Mastra",
    level: "info"
  })
});
