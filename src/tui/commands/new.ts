import { registerCommand } from "./registry.js";

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
