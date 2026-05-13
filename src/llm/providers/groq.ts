import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { LLMProvider, StreamOptions } from "../types.js";
import { validateConfig, getApiKey } from "../config.js";

export const groqProvider: LLMProvider = {
  name: "groq",
  displayName: "Groq",
  models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  modelConfig: {
    "llama-3.3-70b-versatile": { contextLimit: 131_072, inputPricePerM: 0.59, outputPricePerM: 0.79 },
    "llama-3.1-8b-instant": { contextLimit: 131_072, inputPricePerM: 0.05, outputPricePerM: 0.08 },
    "mixtral-8x7b-32768": { contextLimit: 32_768, inputPricePerM: 0.27, outputPricePerM: 0.27 },
  },

  createStream(options: StreamOptions) {
    validateConfig("groq");
    const apiKey = getApiKey("groq");
    const provider = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });

    return streamText({
      model: provider(options.model),
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      maxSteps: 10,
    });
  },
};
