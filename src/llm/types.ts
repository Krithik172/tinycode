import type { CoreMessage, ToolSet, StreamTextResult } from "ai";

export interface ModelConfig {
  contextLimit: number;
  inputPricePerM: number;
  outputPricePerM: number;
}

export interface LLMProvider {
  name: string;
  displayName: string;
  models: string[];
  modelConfig?: Record<string, ModelConfig>;
  createStream(options: StreamOptions): StreamTextResult<ToolSet, never>;
}

export interface StreamOptions {
  model: string;
  system?: string;
  messages: CoreMessage[];
  tools?: ToolSet;
}
