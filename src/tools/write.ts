import { z } from "zod";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Tool } from "./types.js";

const parameters = z.object({
  path: z.string().describe("Absolute path to write the file to"),
  content: z.string().describe("Content to write to the file"),
});

export const writeTool: Tool<typeof parameters> = {
  id: "write",
  description: "Write string content to a file. Creates parent directories if they don't exist. Overwrites existing files.",
  parameters,

  execute({ path, content }) {
    try {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, "utf-8");
      return {
        output: `Wrote ${content.length} characters to "${path}"`,
        metadata: { path, bytesWritten: content.length },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        output: `Error writing to "${path}": ${message}`,
        metadata: { path, error: message },
      };
    }
  },
};
