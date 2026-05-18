import { registerCommand } from "./registry.js";
import { getActive, setActive, list } from "../../llm/index.js";

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
