import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Tool } from "./tools/types.js";

// ─── Message Types ────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      toolCalls?: ToolCall[];
    }
  | { role: "tool"; content: string; toolCallId: string; toolName: string };

// ─── Token Usage ──────────────────────────────────────────

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// ─── Persisted Shape ──────────────────────────────────────

interface SessionData {
  id: string;
  messages: Message[];
  tokenUsage: TokenUsage;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

const SESSIONS_DIR = join(".tinycode", "sessions");

function ensureSessionsDir(): void {
  if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

// ─── Session Class ────────────────────────────────────────

export class Session {
  id: string;
  messages: Message[];
  tokenUsage: TokenUsage;
  createdAt: Date;
  updatedAt: Date;

  constructor(id?: string) {
    this.id = id ?? randomUUID();
    this.messages = [];
    this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  push(msg: Message): void {
    this.messages.push(msg);
    this.updatedAt = new Date();
    this.save();
  }

  getHistory(): Message[] {
    return [...this.messages];
  }

  updateTokenUsage(input: number, output: number): void {
    this.tokenUsage.inputTokens += input;
    this.tokenUsage.outputTokens += output;
    this.tokenUsage.totalTokens =
      this.tokenUsage.inputTokens + this.tokenUsage.outputTokens;
    this.updatedAt = new Date();
    this.save();
  }

  save(): void {
    ensureSessionsDir();
    const data: SessionData = this.toJSON();
    writeFileSync(
      join(SESSIONS_DIR, `${this.id}.json`),
      JSON.stringify(data, null, 2),
    );
  }

  delete(): void {
    const filePath = join(SESSIONS_DIR, `${this.id}.json`);
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  }

  toJSON(): SessionData {
    return {
      id: this.id,
      messages: this.messages,
      tokenUsage: this.tokenUsage,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  static load(id: string): Session {
    const filePath = join(SESSIONS_DIR, `${id}.json`);
    if (!existsSync(filePath)) {
      throw new Error(`Session not found: ${id}`);
    }
    const raw = readFileSync(filePath, "utf-8");
    return Session.fromJSON(JSON.parse(raw));
  }

  static fromJSON(data: SessionData): Session {
    const session = new Session(data.id);
    session.messages = data.messages;
    session.tokenUsage = data.tokenUsage;
    session.createdAt = new Date(data.createdAt);
    session.updatedAt = new Date(data.updatedAt);
    return session;
  }

  static list(): SessionData[] {
    ensureSessionsDir();
    const files = readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".json"));
    const sessions = files.map((f) => {
      const raw = readFileSync(join(SESSIONS_DIR, f), "utf-8");
      return JSON.parse(raw) as SessionData;
    });
    sessions.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return sessions;
  }

  static deleteSession(id: string): void {
    new Session(id).delete();
  }
}

// ─── System Prompt Builder ────────────────────────────────

export function buildSystemPrompt(tools: Tool[]): string {
  const toolLines = tools
    .map((t) => `  - ${t.id}: ${t.description}`)
    .join("\n");

  return [
    "You are TinyCode, a lightweight AI coding agent running in the user's terminal.",
    "",
    "You have access to these tools:",
    "",
    toolLines,
    "",
    "Rules:",
    "1. Read files before making changes.",
    "2. Use bash for running commands (build, test, git operations).",
    "3. Use grep to search code before reading multiple files.",
    "4. Write complete, working code. No placeholders or TODOs.",
    "5. Explain your reasoning concisely.",
    "6. When finished, summarize what was done.",
    "7. If something fails, try to understand why before retrying.",
    "8. Never delete files without explicit confirmation.",
    "9. Be concise. Don't over-explain unless asked.",
  ].join("\n");
}
