import type { LLMProvider, StreamOptions } from "./types.js";
import { geminiProvider } from "./providers/gemini.js";

const registry = new Map<string, LLMProvider>();
let activeProvider: LLMProvider | null = null;

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
  return provider;
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
setActive("gemini");
