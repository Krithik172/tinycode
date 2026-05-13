import { tool as defineTool } from "ai";
import type { ToolSet, CoreMessage } from "ai";
import { Session, buildSystemPrompt } from "./session.js";
import type { Message, TokenUsage } from "./session.js";
import { tools as toolRegistry } from "./tools/index.js";
import { createStream, getActive, getActiveModel } from "./llm/index.js";

// ─── Types ─────────────────────────────────────────────────

export interface AgentCallbacks {
  onTextDelta?: (delta: string) => void;
  onToolCall?: (call: { id: string; name: string; args: string }) => void;
  onToolResult?: (result: {
    id: string;
    name: string;
    output: string;
  }) => void;
  onError?: (error: Error) => void;
}

export interface AgentResult {
  text: string;
  tokenUsage: TokenUsage;
}

// ─── Tool Conversion ───────────────────────────────────────

function buildAITools(): ToolSet {
  const aiTools: ToolSet = {};
  for (const t of toolRegistry) {
    aiTools[t.id] = defineTool({
      description: t.description,
      parameters: t.parameters,
      execute: async (args) => {
        const result = await t.execute(args);
        return result.output;
      },
    });
  }
  return aiTools;
}

// ─── Message Conversion (our Message → CoreMessage) ────────

function toCoreMessage(msg: Message): CoreMessage {
  switch (msg.role) {
    case "user":
      return { role: "user", content: msg.content };

    case "assistant":
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role: "assistant",
          content: [
            ...(msg.content
              ? [{ type: "text" as const, text: msg.content }]
              : []),
            ...msg.toolCalls.map((tc) => ({
              type: "tool-call" as const,
              toolCallId: tc.id,
              toolName: tc.name,
              args: JSON.parse(tc.arguments) as unknown,
            })),
          ],
        } as CoreMessage;
      }
      return { role: "assistant", content: msg.content };

    case "tool":
      return {
        role: "tool",
        content: [
          {
            type: "tool-result" as const,
            toolCallId: msg.toolCallId,
            toolName: msg.toolName,
            result: msg.content,
          },
        ],
      } as CoreMessage;

    case "system":
      return { role: "system", content: msg.content };
  }
}

// ─── Agent Loop ────────────────────────────────────────────

export async function runAgent(
  userInput: string,
  session: Session,
  callbacks: AgentCallbacks = {},
): Promise<AgentResult> {
  const systemPrompt = buildSystemPrompt(toolRegistry);
  const aiTools = buildAITools();
  const provider = getActive();

  session.push({ role: "user", content: userInput });

  const history = session
    .getHistory()
    .filter((m) => m.role !== "system")
    .map(toCoreMessage);

  const streamResult = createStream({
    model: getActiveModel(),
    system: systemPrompt,
    messages: history,
    tools: aiTools,
  });

  let fullText = "";

  try {
    for await (const event of streamResult.fullStream) {
      const ev = event as { type: string; textDelta?: string; toolCallId?: string; toolName?: string; args?: unknown; result?: unknown; error?: unknown };

      switch (ev.type) {
        case "text-delta":
          fullText += ev.textDelta ?? "";
          callbacks.onTextDelta?.(ev.textDelta ?? "");
          break;

        case "tool-call":
          callbacks.onToolCall?.({
            id: ev.toolCallId ?? "",
            name: ev.toolName ?? "",
            args: JSON.stringify(ev.args),
          });
          break;

        case "tool-result":
          callbacks.onToolResult?.({
            id: ev.toolCallId ?? "",
            name: ev.toolName ?? "",
            output:
              typeof ev.result === "string"
                ? ev.result
                : JSON.stringify(ev.result),
          });
          break;

        case "error":
          callbacks.onError?.(
            ev.error instanceof Error
              ? ev.error
              : new Error(String(ev.error)),
          );
          break;
      }
    }

    // Persist new LLM-generated messages to the session
    const response = await streamResult.response;
    const newMessages = response.messages;

    for (const msg of newMessages) {
      if (msg.role === "assistant") {
        let text = "";
        const toolCalls: Array<{
          id: string;
          name: string;
          arguments: string;
        }> = [];

        if (typeof msg.content === "string") {
          text = msg.content;
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            const p = part as { type: string; text?: string; toolCallId?: string; toolName?: string; args?: unknown };

            if (p.type === "text") {
              text += p.text ?? "";
            } else if (p.type === "tool-call") {
              toolCalls.push({
                id: p.toolCallId ?? "",
                name: p.toolName ?? "",
                arguments: JSON.stringify(p.args),
              });
            }
          }
        }

        session.push({
          role: "assistant",
          content: text,
          ...(toolCalls.length > 0 ? { toolCalls } : {}),
        });
      } else if (msg.role === "tool") {
        if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            const p = part as { type: string; toolCallId?: string; toolName?: string; result?: unknown };

            if (p.type === "tool-result") {
              session.push({
                role: "tool",
                content:
                  typeof p.result === "string"
                    ? p.result
                    : JSON.stringify(p.result),
                toolCallId: p.toolCallId ?? "",
                toolName: p.toolName ?? "",
              });
            }
          }
        }
      }
    }

    const usage = await streamResult.usage;
    session.updateTokenUsage(
      usage.promptTokens ?? 0,
      usage.completionTokens ?? 0,
    );

    return {
      text: fullText,
      tokenUsage: { ...session.tokenUsage },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    callbacks.onError?.(error);
    throw error;
  }
}
