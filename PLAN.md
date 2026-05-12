# TinyCode — Implementation Plan

## Step 1 — Project Scaffold

- [x] Initialize git repo
- [x] Create package.json (deps: ai, @ai-sdk/google, zod, chalk)
- [x] Create tsconfig.json (strict, ES2022, NodeNext module)
- [x] Configure build script: `bun build --compile --target=bun-windows-x64 --outfile=tinycode ./src/index.ts`
- [x] Run `bun install` and verify deps resolve
- [x] Create AGENTS.md
- [x] Create PLAN.md

## Step 2 — LLM Client (src/llm.ts)

- [ ] Initialize Google Generative AI provider via @ai-sdk/google
- [ ] Accept model name param (default: gemini-2.0-flash-exp)
- [ ] Read API key from GOOGLE_API_KEY env var with helpful error if missing
- [ ] Export `createStream()` returning a streamText result

## Step 3 — Tool Definitions (src/tools/)

- [ ] Create src/tools/index.ts — typed registry as array of Tool objects
- [ ] Implement src/tools/read.ts — reads file, returns lines with line numbers
- [ ] Implement src/tools/write.ts — writes string content to path
- [ ] Implement src/tools/bash.ts — spawns command with timeout, captures stdout/stderr/exit code
- [ ] Implement src/tools/grep.ts — regex search in files via ripgrep or basic fs read
- [ ] Each tool: `{ id, description, parameters: ZodSchema, execute(params) => { output, metadata } }`

## Step 4 — Session Management (src/session.ts)

- [ ] Define message types: system, user, assistant (with tool calls)
- [ ] Session class: push message, get history
- [ ] Build system prompt (agent identity + tool descriptions + usage rules)
- [ ] Track token usage across turns

## Step 5 — Agent Loop (src/agent.ts)

- [ ] Assemble messages: system prompt + prior history + user input
- [ ] Call streamText with model, messages, tools
- [ ] Process fullStream events:
  - text-delta → emit to UI callback
  - tool-call → execute, emit status to UI
  - tool-result → append to message history
  - error → emit to UI
- [ ] Loop: if tool calls were made, LLM gets another turn; if text-only, done
- [ ] Return final assistant response text

## Step 6 — Terminal UI (src/tui.ts)

- [ ] Readline loop with "> " prompt
- [ ] Chalk-formatted output:
  - User messages dim/cyan
  - Assistant text white/bold
  - Tool calls yellow italic
  - Tool results gray
  - Errors red
- [ ] Exit on Ctrl+C, Ctrl+D, or "/quit"
- [ ] Print token usage summary on exit

## Step 7 — CLI Entry Point (src/index.ts)

- [ ] Parse args: `[prompt]`, `--model`, `--help`
- [ ] Mode 1 — one-shot: run prompt, print response, exit
- [ ] Mode 2 — interactive: start readline TUI loop
- [ ] Wire TUI → agent → TUI pipeline
- [ ] Handle --help with usage text

## Step 8 — Build & Verify

- [ ] `bun run build` produces tinycode.exe
- [ ] Test: `tinycode "say hello in one sentence"`
- [ ] Test: `tinycode` → interactive, type a message, see response
- [ ] Test: `tinycode "read src/index.ts and tell me what it does"`
- [ ] Test: `tinycode "find all .ts files with 'export' in them and summarize"`
- [ ] Run binary from outside repo directory to confirm standalone

## Session Log

### Session 1 (2026-05-11) — Initial Planning

**Completed:**

- AGENTS.md — fully rewritten with project goal, workflow rules, and conventions
- PLAN.md — created with 8-step implementation plan and checkboxes

**Key decisions made:**

- Language: TypeScript, runtime: Bun
- LLM: Google Gemini via Vercel AI SDK (@ai-sdk/google)
- All tools auto-approve (safe since work is scoped to this repo)
- Terminal UI: minimal readline + chalk (fancy UI deferred)
- Distribution: single binary via bun --compile
- Permission model: unrestricted (no path restrictions on write/bash)

**Files changed:**

- `AGENTS.md` — replaced empty-repo boilerplate with full project brief
- `PLAN.md` — created

**Next step:** Step 1 — Project Scaffold (git init, package.json, tsconfig, bun install)

### Session 2 (2026-05-11) — Project Scaffold

**Completed:**

- git init with .gitignore (node_modules/, dist/, \*.exe, .env)
- package.json with deps (ai, @ai-sdk/google, zod, chalk) and build script
- tsconfig.json (strict, ES2022, NodeNext)
- bun install — all 24 packages resolved
- AGENTS.md state section updated
- PLAN.md checkboxes marked done

**Key decisions made:**

- Use full `"C:\Users\Krithik\.bun\bin\bun.exe"` path for Bun commands in this environment
- Keeping build target as `bun-windows-x64` for Windows binary distribution

**Files changed:**

- `.gitignore` — created
- `package.json` — created
- `tsconfig.json` — created
- `AGENTS.md` — updated State section
- `PLAN.md` — checkboxes marked, session log added

**Next step:** Step 2 — LLM Client (src/llm.ts)
