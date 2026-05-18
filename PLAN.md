# TinyCode — Implementation Plan

## Project Vision

A beautiful, lightweight AI coding agent with a polished multi-panel terminal UI.
Built with Ink/React — clean design, smooth streaming, focused tool preview panel.
Differentiator: faster, cleaner, content-first vs OpenCode's heavier TUI.

---

## Step 1 — Project Scaffold

- [x] Initialize git repo
- [x] Create package.json (deps: ai, @ai-sdk/google, zod, chalk)
- [x] Create tsconfig.json (strict, ES2022, NodeNext module)
- [x] Configure build script: `bun build --compile --target=bun-windows-x64 --outfile=tinycode ./src/index.ts`
- [x] Run `bun install` and verify deps resolve
- [x] Create AGENTS.md
- [x] Create PLAN.md

## Step 2 — LLM Provider Architecture (src/llm/)

Provider-agnostic design: add new providers by dropping a file in `providers/` + one line in `index.ts`.

- [x] Create `src/llm/config.ts` — env var validation with `validateConfig()`, `.env` support
- [x] Create `src/llm/types.ts` — `LLMProvider` interface, `StreamOptions` type
- [x] Create `src/llm/providers/gemini.ts` — Gemini provider implementing `LLMProvider`
- [x] Create `src/llm/providers/groq.ts` — Groq provider (OpenAI-compatible) with `@ai-sdk/openai`
- [x] Create `src/llm/index.ts` — registry, `setActive/getActive`, `createStream` factory
- [x] Create `.env.example` with `GOOGLE_API_KEY=`, `GROQ_API_KEY=`
- [x] Verify `.env` is in `.gitignore`
- [x] Default provider set to **Groq** (`llama-3.3-70b-versatile`)

## Step 3 — Tool Definitions (src/tools/)

- [x] Create src/tools/index.ts — typed registry as array of Tool objects
- [x] Create src/tools/types.ts — Tool + ToolResult interfaces (locked return contract)
- [x] Implement src/tools/read.ts — reads file, returns lines with line numbers
- [x] Implement src/tools/write.ts — writes string content to path
- [x] Implement src/tools/bash.ts — spawns command with timeout, captures stdout/stderr/exit code
- [x] Implement src/tools/grep.ts — regex search in files via basic fs read
- [x] Each tool: `{ id, description, parameters: ZodSchema, execute(params) => { output, metadata } }`

## Step 4 — Session Management (src/session.ts)

- [x] Define message types: system, user, assistant (with tool calls)
- [x] Session class: push message, get history
- [x] Build system prompt (agent identity + tool descriptions + usage rules)
- [x] Track token usage across turns
- [x] Persist sessions to `.tinycode/sessions/` as JSON
- [x] Load/resume previous sessions

## Step 5 — Agent Loop (src/agent.ts)

- [x] Assemble messages: system prompt + prior history + user input
- [x] Call streamText with model, messages, tools
- [x] Process fullStream events:
  - text-delta → emit to TUI via `onTextDelta` callback
  - tool-call → execute, emit `onToolCall` status to TUI
  - tool-result → append to message history, emit `onToolResult`
  - error → emit `onError` to TUI
- [x] Loop: if tool calls were made, LLM gets another turn; if text-only, done
- [x] Return final assistant response text + token usage

## Step 6 — Terminal UI (src/tui/) ✅

### 6a — Install Dependencies

- [x] `bun add ink react` and `@types/react`

### 6b — Theme System (src/tui/theme.ts)

- [x] Define clean color palette: teal/blue accent + neutral grays
- [x] Support dark/light terminal detection
- [x] Export theme object consumed by all components

### 6c — App Shell + Layout (src/tui/app.tsx, layout.tsx)

- [x] Root Ink `<App>` component
- [x] Three-zone layout:
  - Header (top): model name, token count
  - Body (middle): horizontal split — conversation | preview
  - Footer (bottom): input bar + status bar
- [x] Configurable split ratio
- [x] Esc to quit

### 6d — Conversation Panel (src/tui/panels/conversation.tsx)

- [x] Scrollable message list (renders bottom-up with overflow clipping)
- [x] User messages (dim), assistant messages with markdown, tool calls (animated)
- [x] Markdown rendering: headers, bold, italic, inline code, code blocks, lists
- [x] Streaming text output via StreamingText component
- [x] Proper line breaks between blocks (paragraphs, headers, lists, code)

### 6e — Preview Panel (src/tui/panels/preview.tsx)

- [x] Right-side panel, always visible by default
- [x] Auto-shows on tool execution (re-opens if closed via Ctrl+B)
- [x] Displays tool output (read, write, bash, grep results) with status header
- [x] Each entry shows tool name, status (spinner/✓/✗), and truncated content
- [x] Ctrl+B closes the preview panel

### 6f — Prompt Input (src/tui/components/prompt-input.tsx)

- [x] Single-line input (Shift+Enter inserts newline for multi-line)
- [x] History navigation (↑/↓) — most recent entries navigated in reverse order
- [x] Submit on Enter
- [x] Commands: `/quit`, `/clear`, `/new`, `/connect`
- [x] `/connect` lists providers or switches with `/connect <name>`
- [ ] (Future) `/model` command for model variant selection within a provider

### 6g — Streaming Text (src/tui/components/streaming-text.tsx)

- [x] Per-character reveal animation (~15ms interval)
- [x] Tool call spinners → checkmark/error on completion (via Spinner in conversation.tsx)
- [x] Blinking cursor indicator while streaming
- [x] Markdown rendering applied during streaming (not after)

### 6h — Header + Status Bar (src/tui/components/header.tsx, footer.tsx)

- [x] Header: active provider display name + model, running token count
- [x] Header: token breakdown (in/out/total), context window %, cost estimate
- [x] Status bar: mode indicator, keybinding hints

### 6i — UI Polish
- [x] Thin footer border (`single` instead of `bold`)
- [x] Conversation panel anchored to bottom (`justifyContent="flex-end"`)
- [x] User messages right-aligned with background-fill bubble (no border)
- [x] Assistant messages left-aligned, no box (clean markdown)
- [x] Multi-line input via Shift+Enter, each line rendered separately
- [x] Chat scrolling with PageUp/PageDown (dual-mode: flex-end for bottom, offset for scroll)

## Step 7 — CLI Entry Point (src/index.ts)

- [x] Parse args: `[prompt]`, `--model`, `--help`
- [x] Mode 1 — one-shot: run prompt, print plain stdout, exit
- [x] Mode 2 — interactive: start Ink TUI
- [x] Handle --help with usage text

## Step 8 — Build & Verify ✅

- [x] `bun run build` produces tinycode.exe
- [x] Test: `tinycode "say hello in one sentence"`
- [x] Test: `tinycode "read src/index.ts and tell me what it does"` (tool: read)
- [x] Test: `tinycode "find all .ts files with 'export' in them and summarize"` (tool: grep)
- [x] Run binary from outside repo directory to confirm standalone

## Step 9 — UI Polish & Scroll ✅

- [x] Chat-style message layout: user messages right-aligned with background fill, assistant left-aligned
- [x] Multi-line prompt input with proper line-by-line display (Shift+Enter only)
- [x] Kitty keyboard protocol enabled for disambiguated modifier keys
- [x] Remove border from user message bubble, keep shaded background only
- [x] Add `overflow="hidden"` to root layout to prevent overflow past terminal boundary
- [x] Fixed-height conversation panel computed from terminal rows
- [x] Chat scrolling with PageUp/PageDown — older messages revealed at top via scroll offset

---

## Session Log

Session history has moved to [CHANGELOG.md](./CHANGELOG.md).
