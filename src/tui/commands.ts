import { getActive, setActive, setActiveModel, getActiveModel, list } from "../llm/index.js";
import type { LLMProvider } from "../llm/types.js";
import type { ConversationEntry } from "./panels/conversation.js";

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

registerCommand({
  id: "exit",
  label: "/exit",
  description: "Exit TinyCode",
  hasSubmenu: false,
  handler: (_args, ctx) => {
    ctx.exit();
  },
});

registerCommand({
  id: "clear",
  label: "/clear",
  description: "Clear conversation history",
  hasSubmenu: false,
  handler: (_args, ctx) => {
    ctx.resetSession();
    ctx.addEntry({
      id: ctx.nextId(),
      type: "assistant",
      content: "Conversation cleared.",
    });
  },
});

registerCommand({
  id: "new",
  label: "/new",
  description: "Start a new session",
  hasSubmenu: false,
  handler: (_args, ctx) => {
    ctx.resetSession();
    ctx.addEntry({
      id: ctx.nextId(),
      type: "assistant",
      content: "New session started.",
    });
  },
});

registerCommand({
  id: "connect",
  label: "/connect",
  description: "Switch LLM provider",
  hasSubmenu: true,
  getSubmenuItems: () => {
    const providers = list();
    const active = getActive();
    return providers.map((p) => ({
      label: p.displayName,
      value: p.name,
      description: `models: ${p.models.length}`,
      isActive: p.name === active.name,
    }));
  },
  handler: (args, ctx) => {
    if (args.length === 0) return;
    const name = args[0];
    try {
      ctx.setActiveLlm(name);
      ctx.forceRender();
      ctx.setStatusText("Ready");
      ctx.addEntry({
        id: ctx.nextId(),
        type: "assistant",
        content: `Switched to provider: **${name}**`,
      });
    } catch (e) {
      ctx.addEntry({
        id: ctx.nextId(),
        type: "assistant",
        content: `Error: ${(e as Error).message}`,
      });
    }
  },
});

registerCommand({
  id: "model",
  label: "/model",
  description: "Switch model variant",
  hasSubmenu: true,
  getSubmenuItems: () => {
    const provider = getActive();
    const activeModel = getActiveModel();
    return provider.models.map((m) => ({
      label: m,
      value: m,
      description: provider.modelConfig?.[m]
        ? `${provider.modelConfig[m].contextLimit.toLocaleString()} ctx`
        : undefined,
      isActive: m === activeModel,
    }));
  },
  handler: (args, ctx) => {
    if (args.length === 0) return;
    const modelName = args[0];
    try {
      ctx.setActiveModel(modelName);
      ctx.forceRender();
      ctx.setStatusText("Ready");
      ctx.addEntry({
        id: ctx.nextId(),
        type: "assistant",
        content: `Switched to model: **${modelName}**`,
      });
    } catch (e) {
      ctx.addEntry({
        id: ctx.nextId(),
        type: "assistant",
        content: `Error: ${(e as Error).message}`,
      });
    }
  },
});
