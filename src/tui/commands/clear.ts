import { registerCommand } from "./registry.js";

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
