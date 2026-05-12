import { z } from "zod";
import { readFileSync, existsSync, statSync } from "node:fs";
import type { Tool } from "./types.js";

const parameters = z.object({
  path: z.string().describe("Absolute path to the file to read"),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Starting line number (1-indexed)"),
  limit: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum number of lines to return"),
});

export const readTool: Tool<typeof parameters> = {
  id: "read",
  description: "Read a file and return its contents with line numbers. Supports optional offset and limit to read specific sections.",
  parameters,

  execute({ path, offset, limit }) {
    if (!existsSync(path)) {
      return {
        output: `Error: file not found at "${path}"`,
        metadata: { path, found: false },
      };
    }

    const stat = statSync(path);
    if (!stat.isFile()) {
      return {
        output: `Error: "${path}" is not a file`,
        metadata: { path, isFile: false },
      };
    }

    const content = readFileSync(path, "utf-8");
    const lines = content.split("\n");

    const start = offset ? Math.max(0, offset - 1) : 0;
    const end = limit ? Math.min(lines.length, start + limit) : lines.length;
    const slice = lines.slice(start, end);

    const numbered = slice
      .map((line, i) => `${start + i + 1}: ${line}`)
      .join("\n");

    return {
      output: numbered,
      metadata: {
        path,
        totalLines: lines.length,
        returnedLines: slice.length,
        offset: start + 1,
        limit: limit ?? lines.length,
      },
    };
  },
};
