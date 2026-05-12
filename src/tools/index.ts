import type { Tool } from "./types.js";
import { readTool } from "./read.js";
import { writeTool } from "./write.js";
import { bashTool } from "./bash.js";
import { grepTool } from "./grep.js";

export type { Tool, ToolResult } from "./types.js";
export { readTool, writeTool, bashTool, grepTool };

export const tools: Tool[] = [readTool, writeTool, bashTool, grepTool];
