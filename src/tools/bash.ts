import { z } from "zod";
import { execSync } from "node:child_process";
import type { Tool } from "./types.js";

const parameters = z.object({
  command: z.string().describe("Shell command to execute"),
  description: z
    .string()
    .optional()
    .describe("Brief description of what the command does (5-10 words)"),
  timeout: z
    .number()
    .int()
    .min(1_000)
    .max(300_000)
    .optional()
    .default(120_000)
    .describe("Timeout in milliseconds (default 120000)"),
});

export const bashTool: Tool<typeof parameters> = {
  id: "bash",
  description:
    "Execute a shell command with a timeout. Captures stdout, stderr, and exit code. Use for file operations, git, npm, and other terminal tasks.",
  parameters,

  execute({ command, timeout }) {
    const start = performance.now();

    try {
      const stdout = execSync(command, {
        encoding: "utf-8",
        timeout,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      });
      const elapsed = Math.round(performance.now() - start);

      return {
        output: stdout,
        metadata: {
          command,
          exitCode: 0,
          elapsed,
          timedOut: false,
        },
      };
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - start);
      const error = err as Error & {
        stderr?: string;
        stdout?: string;
        status?: number;
        signal?: string;
      };

      const stderr = error.stderr ?? "";
      const stdout = error.stdout ?? "";
      const exitCode = error.status ?? 1;
      const signal = error.signal ?? null;

      const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
      const isTimeout = signal === "SIGTERM" || elapsed >= (timeout ?? 120_000);

      return {
        output: combined || error.message,
        metadata: {
          command,
          exitCode,
          elapsed,
          timedOut: isTimeout,
          signal,
        },
      };
    }
  },
};
