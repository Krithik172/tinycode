import type { LLMProvider } from "../../llm/types.js";
import type { ConversationEntry } from "../panels/conversation.js";

export interface SubmenuItem {
  label: string;
  value: string;
  description?: string;
  isActive?: boolean;
}

export interface CommandContext {
  exit: () => void;
  addEntry: (entry: ConversationEntry) => void;
  setStatusText: (text: string) => void;
  forceRender: () => void;
  nextId: () => string;
  resetSession: () => void;
  getActiveLlm: () => LLMProvider;
  setActiveLlm: (name: string) => LLMProvider;
  setActiveModel: (model: string) => void;
  getActiveModel: () => string;
  listProviders: () => LLMProvider[];
}

export interface CommandDefinition {
  id: string;
  label: string;
  description: string;
  hasSubmenu: boolean;
  getSubmenuItems?: () => SubmenuItem[];
  handler: (args: string[], context: CommandContext) => void;
}

const registry = new Map<string, CommandDefinition>();

export function registerCommand(cmd: CommandDefinition): void {
  registry.set(cmd.id, cmd);
}

export function getCommand(id: string): CommandDefinition | undefined {
  return registry.get(id);
}

export function getAllCommands(): CommandDefinition[] {
  return [...registry.values()];
}

export function findCommand(input: string): CommandDefinition | undefined {
  const clean = input.startsWith("/") ? input.slice(1) : input;
  return registry.get(clean);
}
