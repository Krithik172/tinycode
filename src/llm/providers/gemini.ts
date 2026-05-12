import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type ToolSet } from "ai";
import type { LLMProvider, StreamOptions } from "../types.js";
import { validateConfig, getApiKey } from "../config.js";

export const geminiProvider: LLMProvider = {
  name: "gemini",
  displayName: "Google Gemini",
  models: ["gemini-2.0-flash-exp", "gemini-2.0-flash", "gemini-2.5-pro-exp-03-25"],
  modelConfig: {
    "gemini-2.0-flash-exp": { contextLimit: 1_048_576, inputPricePerM: 0.10, outputPricePerM: 0.40 },
    "gemini-2.0-flash": { contextLimit: 1_048_576, inputPricePerM: 0.10, outputPricePerM: 0.40 },
    "gemini-2.5-pro-exp-03-25": { contextLimit: 1_048_576, inputPricePerM: 1.25, outputPricePerM: 10.0 },
  },

  createStream(options: StreamOptions) {
    validateConfig("gemini");
    const apiKey = getApiKey("gemini");
    const provider = createGoogleGenerativeAI({ apiKey });

    return streamText({
      model: provider(options.model),
      system: options.system,
      messages: options.messages,
      tools: options.tools as ToolSet | undefined,
      maxSteps: 10,
    });
  },
};
