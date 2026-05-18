import { registerCommand } from "./registry.js";
import { getActive, getActiveModel, setActiveModel } from "../../llm/index.js";

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
