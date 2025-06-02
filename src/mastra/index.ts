import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";
import { catAgent } from "~/mastra/agents";

export const mastra = new Mastra({
  // workflows: {},
  agents: { catAgent },
  logger: createLogger({
    name: "Mastra",
    level: "info"
  })
});
