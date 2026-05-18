import { registerCommand } from "./registry.js";

registerCommand({
  id: "exit",
  label: "/exit",
  description: "Exit TinyCode",
  hasSubmenu: false,
  handler: (_args, ctx) => {
    ctx.exit();
  },
});
