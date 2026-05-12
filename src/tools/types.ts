import type { z } from "zod";

export interface ToolResult {
  output: string;
  metadata: Record<string, unknown>;
}

export interface Tool<T extends z.ZodTypeAny = z.ZodTypeAny> {
  id: string;
  description: string;
  parameters: T;
  execute(params: z.infer<T>): ToolResult | Promise<ToolResult>;
}
