// ─── Side-effect imports: each file registers itself ───
import "./exit.js";
import "./clear.js";
import "./new.js";
import "./connect.js";
import "./model.js";

// ─── Re-export registry API ───
export {
  registerCommand,
  getCommand,
  getAllCommands,
  findCommand,
} from "./registry.js";

export type {
  CommandDefinition,
  CommandContext,
  SubmenuItem,
} from "./registry.js";
