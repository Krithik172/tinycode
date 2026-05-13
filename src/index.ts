import { render } from "ink";
import { createElement } from "react";
import { App } from "./tui/app.js";
import { runAgent } from "./agent.js";
import { Session } from "./session.js";
import { setActiveModel } from "./llm/index.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
TinyCode — Lightweight AI Coding Agent

Usage:
  tinycode [prompt]             One-shot mode: run prompt and print result
  tinycode                      Interactive mode: launch TUI

Options:
  --model <name>   Set the model variant (e.g., --model gemini-2.0-flash)
  --help, -h       Show this help message
`);
  process.exit(0);
}

const modelIndex = args.indexOf("--model");
if (modelIndex !== -1 && modelIndex + 1 < args.length) {
  try {
    setActiveModel(args[modelIndex + 1]);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
  args.splice(modelIndex, 2);
}

const prompt = args.find((a) => !a.startsWith("-"));

if (prompt) {
  await runOneShot(prompt);
} else {
  await runInteractive();
}

async function runOneShot(prompt: string): Promise<void> {
  const session = new Session();
  try {
    const result = await runAgent(prompt, session);
    console.log(result.text);
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    process.exit(1);
  }
}

async function runInteractive(): Promise<void> {
  const { waitUntilExit } = render(createElement(App), { alternateScreen: true });
  await waitUntilExit();
}
