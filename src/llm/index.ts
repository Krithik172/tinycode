import type { LLMProvider, StreamOptions } from "./types.js";
import { geminiProvider } from "./providers/gemini.js";
import { groqProvider } from "./providers/groq.js";

const registry = new Map<string, LLMProvider>();
let activeProvider: LLMProvider | null = null;
let activeModel: string | null = null;

export function register(provider: LLMProvider): void {
  registry.set(provider.name, provider);
}

export function setActive(name: string): LLMProvider {
  const provider = registry.get(name);
  if (!provider) {
    throw new Error(
      `Provider "${name}" not found. Available: ${[...registry.keys()].join(", ")}`
    );
  }
  activeProvider = provider;
  activeModel = provider.models[0];
  return provider;
}

export function getActiveModel(): string {
  if (!activeModel) {
    activeModel = getActive().models[0];
  }
  return activeModel;
}

export function setActiveModel(model: string): void {
  const provider = getActive();
  if (!provider.models.includes(model)) {
    throw new Error(
      `Model "${model}" not available. Available: ${provider.models.join(", ")}`
    );
  }
  activeModel = model;
}

export function getActive(): LLMProvider {
  if (!activeProvider) {
    throw new Error("No active LLM provider. Call setActive() first.");
  }
  return activeProvider;
}

export function list(): LLMProvider[] {
  return [...registry.values()];
}

export function createStream(options: StreamOptions) {
  return getActive().createStream(options);
}

register(geminiProvider);
register(groqProvider);
setActive("groq");
