import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Tool } from "./types.js";

const parameters = z.object({
  pattern: z.string().describe("Regular expression pattern to search for"),
  path: z
    .string()
    .optional()
    .describe("Directory or file to search in (defaults to current working directory)"),
  include: z
    .string()
    .optional()
    .describe("Glob-style file pattern filter (e.g. '*.ts', '*.{ts,tsx}')"),
});

function matchesFilter(filename: string, include?: string): boolean {
  if (!include) return true;
  const parts = include.split(",").map((p) => p.trim());
  return parts.some((part) => {
    const regex = new RegExp(
      `^${part
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".")}$`
    );
    return regex.test(filename);
  });
}

function walkDir(
  dir: string,
  include?: string
): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!entry.startsWith(".") && entry !== "node_modules") {
          results.push(...walkDir(fullPath, include));
        }
      } else if (stat.isFile() && matchesFilter(entry, include)) {
        results.push(fullPath);
      }
    } catch {
      continue;
    }
  }

  return results;
}

export const grepTool: Tool<typeof parameters> = {
  id: "grep",
  description:
    "Search file contents using a regular expression. Returns matching files with line numbers and context. Skips node_modules and hidden directories by default.",
  parameters,

  execute({ pattern, path, include }) {
    const searchPath = path ?? process.cwd();

    if (!existsSync(searchPath)) {
      return {
        output: `Error: path "${searchPath}" does not exist`,
        metadata: { pattern, path: searchPath, matches: 0, files: 0 },
      };
    }

    const regex = new RegExp(pattern, "g");
    const files = walkDir(searchPath, include);
    const results: string[] = [];
    let totalMatches = 0;

    for (const file of files) {
      try {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");
        const fileMatches: string[] = [];
        let lineMatch: RegExpExecArray | null;

        for (let i = 0; i < lines.length; i++) {
          regex.lastIndex = 0;
          if ((lineMatch = regex.exec(lines[i])) !== null) {
            fileMatches.push(`  ${i + 1}: ${lines[i].trim()}`);
            totalMatches++;
          }
        }

        if (fileMatches.length > 0) {
          const rel = relative(process.cwd(), file);
          results.push(`${rel}:`);
          results.push(...fileMatches);
        }
      } catch {
        continue;
      }
    }

    if (results.length === 0) {
      return {
        output: `No matches found for "${pattern}" in ${searchPath}`,
        metadata: { pattern, path: searchPath, matches: 0, files: 0 },
      };
    }

    return {
      output: results.join("\n"),
      metadata: {
        pattern,
        path: searchPath,
        matches: totalMatches,
        files: files.length,
        matchingFiles: results.filter((l) => l.endsWith(":")).length,
      },
    };
  },
};
