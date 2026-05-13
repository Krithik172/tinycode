# Changelog

All session logs for TinyCode development.

### Session 1 (2026-05-11) — Initial Planning

**Completed:** AGENTS.md, PLAN.md created
**Next step:** Step 1 — Project Scaffold

### Session 2 (2026-05-11) — Project Scaffold

**Completed:** git init, package.json, tsconfig.json, bun install, .gitignore
**Next step:** Step 2 — LLM Client

### Session 3 (2026-05-11) — LLM Client

**Completed:** src/llm.ts with Google Gemini provider, createStream()
**Next step:** Step 3 — Tool Definitions

### Session 4 (2026-05-12) — TUI-First Pivot

**Completed:**

- Reprioritized project to focus on terminal UI as primary differentiator
- Upgraded TUI plan from simple readline/chalk to full Ink/React multi-panel TUI
- Added: session persistence, markdown rendering, token count display
- Keybindings: Esc to quit, ↑/↓ history, Ctrl+B toggle preview, /new for new session

**Key decisions made:**

- Framework: Ink (React-based) — same foundation as OpenCode but lighter scope
- Differentiators: clean minimal design, multi-panel layout, superior streaming UX
- Build order: backend first (tools → session → agent), then TUI on top
- Right panel: auto-shows tool output (diffs, bash, grep), hidden by default
- Session persistence: `.tinycode/sessions/` as JSON files
- Markdown rendering: regex-based, no full markdown library dependency

**Files changed:**

- `AGENTS.md` — updated project goal and state
- `PLAN.md` — revised Step 6 (TUI) with 8 sub-steps, added session persistence

### Session 5 (2026-05-12) — LLM Provider Architecture

**Completed:**

- Refactored monolithic `src/llm.ts` into `src/llm/` directory with provider pattern
- Created `types.ts`, `config.ts`, `providers/gemini.ts`, `index.ts`
- Added eager env var validation via `validateConfig()` — fails early, fails loud
- Created `.env.example` with `GOOGLE_API_KEY=` reference

**Key decisions made:**

- Provider registry pattern: `register()` + `setActive/getActive()` + `list()`
- `.env` file at project root (Bun auto-loads it)
- API key validation happens at provider activation, before any LLM call
- `/connect` command in TUI to switch providers (provider-only, no model variant yet)
- Provider choice is per-session only (resets to default next session)
- `/model` command for model selection is a future step

**Files changed:**

- `src/llm.ts` — removed (replaced by directory structure)
- `src/llm/types.ts` — created
- `src/llm/config.ts` — created
- `src/llm/providers/gemini.ts` — created
- `src/llm/index.ts` — created
- `.env.example` — created
- `PLAN.md` — updated Step 2, added /connect to Step 6f, session log
- `AGENTS.md` — updated project goal and state

### Session 6 (2026-05-12) — LLM Provider Architecture (implement)

**Completed:**

- Created `src/llm/types.ts` — `LLMProvider` interface, `StreamOptions` type
- Created `src/llm/config.ts` — `validateConfig()`, `getApiKey()`, provider env config map
- Created `src/llm/providers/gemini.ts` — Gemini provider implementing `LLMProvider`
- Created `src/llm/index.ts` — registry (register/setActive/getActive/list), createStream factory
- Removed old monolithic `src/llm.ts`
- Verified TypeScript compiles cleanly (`tsc --noEmit`)

**Files changed:**

- `src/llm.ts` — removed
- `src/llm/types.ts` — created
- `src/llm/config.ts` — created
- `src/llm/providers/gemini.ts` — created
- `src/llm/index.ts` — created
- `PLAN.md` — checked off Step 2 items
- `AGENTS.md` — updated next step

### Session 7 (2026-05-12) — Tool Definitions

**Completed:**

- Created `src/tools/types.ts` — `Tool` and `ToolResult` interfaces, locked return contract `{ output, metadata }`
- Created `src/tools/read.ts` — reads file with optional offset/limit, returns numbered lines
- Created `src/tools/write.ts` — writes string content, creates parent dirs automatically
- Created `src/tools/bash.ts` — spawns command with timeout, captures stdout/stderr/exit code
- Created `src/tools/grep.ts` — regex search across files, skips node_modules/hidden dirs
- Created `src/tools/index.ts` — typed registry exporting `tools: Tool[]`
- Verified TypeScript compiles cleanly (`tsc --noEmit`)

**Files changed:**

- `src/tools/types.ts` — created
- `src/tools/read.ts` — created
- `src/tools/write.ts` — created
- `src/tools/bash.ts` — created
- `src/tools/grep.ts` — created
- `src/tools/index.ts` — created
- `PLAN.md` — checked off Step 3 items
- `AGENTS.md` — updated next step

### Session 8 (2026-05-12) — Session Management

**Completed:**

- Created `src/session.ts` with:
  - Message types: `Message` discriminated union (system, user, assistant with tool calls, tool result)
  - `Session` class: `push()`, `getHistory()`, `updateTokenUsage()`, `save()`, `delete()`, `toJSON()`
  - Static methods: `load()`, `fromJSON()`, `list()`, `deleteSession()`
  - `buildSystemPrompt()` — generates agent identity + tool descriptions + rules dynamically
  - Token usage tracking: input, output, total across turns
  - Persistence to `.tinycode/sessions/<id>.json` with auto-created directory
- Verified TypeScript compiles cleanly (`tsc --noEmit`)

**Key decisions made:**

- System prompt is built dynamically from the tool registry (not stored in session) so tool changes don't stale old sessions
- `getHistory()` returns a copy to prevent external mutation
- Session list sorted by `updatedAt` descending (newest first)
- UUID-based session IDs via `crypto.randomUUID()`

**Files changed:**

- `src/session.ts` — created
- `PLAN.md` — checked off Step 4 items
- `CHANGELOG.md` — added session log
- `AGENTS.md` — (next step updated)

### Session 9 (2026-05-12) — Agent Loop

**Completed:**

- Created `src/agent.ts` with:
  - `runAgent()` — main agent loop: builds system prompt + messages, calls `streamText`, processes `fullStream` events
  - `buildAITools()` — converts `Tool[]` registry to AI SDK `ToolSet` using `tool()` helper with auto-execute
  - `toCoreMessage()` — converts our `Message` type to AI SDK `CoreMessage` (content-array format with `ToolCallPart`/`ToolResultPart`)
  - `AgentCallbacks` interface — `onTextDelta`, `onToolCall`, `onToolResult`, `onError` for TUI integration
  - `AgentResult` — final text + token usage
- Session persistence after LLM turn: extracts assistant + tool messages from `response.messages` and pushes to session
- Token usage accumulation via `streamResult.usage` promise

**Key decisions made:**

- AI SDK's built-in `maxSteps` (set to 10 in provider) handles multi-turn tool-call → execution → result → response loop automatically; we observe via `fullStream` events
- `ToolSet` generic loses concrete tool types → `tool-result` event not in TypeScript union at type level; cast to broader type to access at runtime
- `response.messages` is the authoritative source for persisting the LLM's full conversation turn (includes intermediate assistant + tool messages)
- Tool `execute` functions return `result.output` (string) to the SDK, which feeds it back to the LLM

**Files changed:**

- `src/agent.ts` — created
- `src/session.ts` — added `toolName` field to tool `Message` type for AI SDK compatibility
- `PLAN.md` — checked off Step 5 items
- `CHANGELOG.md` — added session log
- `AGENTS.md` — updated next step

### Session 10 (2026-05-12) — Terminal UI: Theme + App Shell + Header/Footer

**Completed:**

- Installed ink@7.0.2 and react@19.2.6 with @types/react
- Created `src/tui/theme.ts` — typed theme with teal accent palette, dark/light auto-detection
- Created `src/tui/app.tsx` — root Ink `<App>` component with Esc-to-quit via useInput
- Created `src/tui/layout.tsx` — three-zone flex layout (header, body with horizontal split, footer)
- Created `src/tui/components/header.tsx` — shows "tinycode · provider/model" + Δ token count
- Created `src/tui/components/footer.tsx` — input line placeholder + status bar with keybinding hints
- Created `src/tui/index.ts` — barrel export
- Created temporary `src/index.ts` entry point for previewing the TUI
- Enabled `jsx: "react-jsx"` in tsconfig.json and added .tsx to include patterns

**Key decisions made:**

- Border-boxed header and footer (using Ink `borderStyle="single"`) with borderless body zone creates a clean terminal-app look with visual separators
- Avoided full outer borders to maximize content area
- Separator between conversation/preview panels is a 1-col `Box` with `backgroundColor={border}` when preview is visible
- Fragment `<>...</>` for conditional multi-child rendering to avoid React key warnings
- `createElement(App)` in non-TSX entry point to avoid needing `.tsx` extension

**Files changed:**

- `tsconfig.json` — added jsx, extended include to .tsx files
- `src/tui/theme.ts` — created
- `src/tui/app.tsx` — created
- `src/tui/layout.tsx` — created
- `src/tui/components/header.tsx` — created
- `src/tui/components/footer.tsx` — created
- `src/tui/index.ts` — created (barrel export)
- `src/index.ts` — created (temporary entry point for TUI preview)
- `PLAN.md` — checked off 6a, 6b, 6c, 6h
- `CHANGELOG.md` — updated

### Session 11 (2026-05-12) — Conversation Panel + Streaming Text + Markdown

**Completed:**

- Created `src/tui/components/spinner.tsx` — braille animated spinner (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`) using setInterval
- Created `src/tui/components/streaming-text.tsx` — per-character reveal animation at ~15ms, blinking cursor while streaming, auto-catchup via messageId tracking
- Created `src/tui/utils/markdown.tsx` — regex-based markdown → Ink elements renderer. Supports: inline code (backticks), bold (`**`), italic (`*`), code blocks (` ``` `), headers (`#`), lists (`-`, `*`, `1.`)
- Created `src/tui/panels/conversation.tsx` — `ConversationPanel` + `ConversationBubble` components. Renders user (dim), assistant (bright + markdown), tool (with spinner/checkmark/error) messages. Shows "Ready — start a conversation" placeholder when empty.
- Updated `src/tui/app.tsx` — manages conversation entries in state, `addEntry`/`updateLastEntry` helpers for agent loop integration, Ctrl+Shift+B toggles preview panel
- Created `src/demo.tsx` — standalone demo with simulated streaming to preview the conversation panel live
- Updated `src/tui/index.ts` — barrel exports for new components

**Key decisions made:**

- `StreamingText` uses a `messageId` prop to detect new messages and reset animation (text content changes would be ambiguous)
- Markdown renderer is block-based: splits on line boundaries, renders inline formatting for each line; avoids pulling in a full markdown library
- Conversation panel uses Ink's natural overflow clipping — messages stack from bottom, oldest clip at top (no scroll widget needed)
- Tool call entries have three statuses: `running` (spinner), `success` (✓), `error` (✗)
- Demo file is separate from main entry point to keep production code clean

**Files changed:**

- `src/tui/components/spinner.tsx` — created
- `src/tui/components/streaming-text.tsx` — created
- `src/tui/utils/markdown.tsx` — created
- `src/tui/panels/conversation.tsx` — created
- `src/tui/app.tsx` — updated with conversation state management
- `src/tui/index.ts` — updated exports
- `src/demo.tsx` — created
- `PLAN.md` — checked off 6d, 6g
- `CHANGELOG.md` — updated

### Session 12 (2026-05-12) — Preview Panel + Prompt Input + Agent Integration

**Completed:**

- Created `src/tui/components/prompt-input.tsx` — full input component with:
  - Enter to submit, Shift+Enter for newline
  - ↑/↓ history navigation (stores submitted messages, reverse-order browsing)
  - Block cursor (`█`) at end of input
  - Ignores Ctrl/Meta shortcuts (leaves those to App)
- Created `src/tui/panels/preview.tsx` — tool execution preview panel:
  - Shows tool name + status indicator (Spinner/✓/✗)
  - Displays tool output content (truncated at 500 chars)
  - Empty state: "Tool output appears here"
- Updated `src/tui/components/footer.tsx` — accepts `onSubmit` prop, renders PromptInput inside bordered box, status bar below
- Updated `src/tui/app.tsx` — full integration:
  - State management for conversation entries, preview entries, session, token count, status
  - Command handling: `/quit`, `/clear`, `/new`, `/connect`, `/connect <name>`
  - Agent loop integration via `runAgent()` with all callbacks (`onTextDelta`, `onToolCall`, `onToolResult`, `onError`)
  - Auto-shows preview panel on tool execution
  - Ctrl+B toggles preview (send `\x02` or `'b'` with ctrl)
  - Running guard (prevents double-submit while agent is active)
  - Provider switching updates header via `forceRender` reducer
- Updated `src/demo.tsx` — fixed to pass `onSubmit` prop to Footer
- Updated `src/tui/index.ts` — exports for PromptInput, PreviewPanel, PreviewEntry

**Files changed:**

- `src/tui/components/prompt-input.tsx` — created
- `src/tui/panels/preview.tsx` — created
- `src/tui/components/footer.tsx` — updated (onSubmit prop, PromptInput integration)
- `src/tui/app.tsx` — updated (full agent loop + command integration)
- `src/demo.tsx` — fixed (onSubmit prop)
- `src/tui/index.ts` — updated exports
- `PLAN.md` — checked off 6e, 6f

**Next step:** Step 7 — CLI Entry Point

### Session 13 (2026-05-13) — Complete Terminal UI Step 6

**Completed:**

- Finished remaining Step 6 sub-steps: Prompt Input (6f) and Preview Panel (6e)
- Created `src/tui/components/prompt-input.tsx` — Enter submit, ↑/↓ history, Shift+Enter newline, placeholder text, block cursor
- Created `src/tui/panels/preview.tsx` — right-side tool output panel with status icons (⠋/✓/✗), auto-shows on tool execution
- Updated `src/tui/components/footer.tsx` — integrated PromptInput, passed through `onSubmit` prop
- Updated `src/tui/app.tsx` — full agent loop integration:
  - `handleSubmit` dispatches to commands (`/quit`, `/clear`, `/new`, `/connect`, `/connect <name>`) or `runAgent()`
  - `appendAssistantDelta` — collects text deltas into the current streaming assistant message
  - `onToolCall` → adds tool entry + preview entry, auto-shows preview
  - `onToolResult` → updates tool/preview entries to success with output
  - `onError` → marks running tools as error, shows error in status bar
  - `isRunningRef` guard prevents double-submit
  - `forceRender` reducer ensures provider switch updates header
  - Ctrl+B toggles preview panel
- Added `src/demo.tsx` demo entry point — simulated streaming conversation for UI preview
- Documented all new files in barrel export

**Files changed:**

- `src/tui/components/prompt-input.tsx` — created
- `src/tui/panels/preview.tsx` — created
- `src/tui/components/footer.tsx` — updated
- `src/tui/app.tsx` — updated
- `src/tui/index.ts` — updated
- `src/demo.tsx` — created
- `PLAN.md` — checked off 6e, 6f
- `AGENTS.md` — updated state
- `CHANGELOG.md` — updated

### Session 14 (2026-05-13) — UI Enhancements: Header Metrics, Streaming Markdown, Line Breaks

**Completed:**

- **Header overhaul** (`src/tui/components/header.tsx`):
  - Now shows input/output/total token breakdown (e.g., "Δ 1.2k i · 3.4k o · 4.6k t")
  - Computes and displays percentage of context window used (e.g., "(3.6%)")
  - Computes and displays estimated cost based on model pricing (e.g., "$0.0012")
  - Gracefully falls back when no model config is available
- **Model metadata** (`src/llm/types.ts`, `src/llm/providers/gemini.ts`):
  - Added `ModelConfig` interface (`contextLimit`, `inputPricePerM`, `outputPricePerM`)
  - Added `modelConfig` property to `LLMProvider` interface
  - Populated Gemini model configs with context windows and pricing
- **Markdown during streaming** (`src/tui/components/streaming-text.tsx`):
  - Streaming now renders visible text through `renderMarkdown()` instead of plain `<Text>`
  - Markdown formatting (bold, italic, code, headers, lists) appears simultaneously with character reveal
  - Accepts `color` prop passed from `ConversationBubble`
- **Line break fix** (`src/tui/utils/markdown.tsx`, `src/tui/panels/conversation.tsx`):
  - Removed parent `<Text color={...}>` wrapper that collapsed all content inline
  - Changed to `<Box flexDirection="column">` so each markdown block renders on its own line
  - `renderMarkdown()` now uses `addNode()` helper that inserts `{"\n"}` spacers between blocks
  - All `<Text>` elements in markdown output carry explicit color via the `color` parameter
  - Empty lines produce paragraph breaks via `{"\n"}` spacers
- **Integration** (`src/tui/app.tsx`, `src/demo.tsx`):
  - Changed `tokenCount` state to `tokenUsage: TokenUsage` (input/output/total breakdown)
  - Passes `tokenUsage` and `modelConfig` to Header
  - Demo updated for new props

**Files changed:**

- `src/llm/types.ts` — added ModelConfig interface, modelConfig on LLMProvider
- `src/llm/providers/gemini.ts` — added modelConfig entries for all models
- `src/tui/utils/markdown.tsx` — added color param, addNode() with newline spacers; **fixed:** removed addNode's automatic `\n` spacer (flex column was double-spacing), switched to flat push for each block with `{" "}` spacers for empty lines
- `src/tui/components/streaming-text.tsx` — now renders through renderMarkdown, accepts color prop
- `src/tui/panels/conversation.tsx` — removed parent `<Text>` wrapper, uses Box flexDirection column, passes color
- `src/tui/components/header.tsx` — accepts tokenUsage + modelConfig; **fixed:** removed input/output/total breakdown, shows "Tokens Used: N,NNN (P.P%) · $C.CC" with comma formatting
- `src/tui/components/footer.tsx` — bold teal border, background color (`inputBg`), visually distinct and fixed at bottom
- `src/tui/theme.ts` — lightened `inputBg` from `#161A22` to `#191E2A`
- `src/tui/app.tsx` — tokenUsage state instead of tokenCount, passes new props to Header
- `src/demo.tsx` — updated Header props
- `CHANGELOG.md` — updated

**Next step:** Step 8 — Build & Verify

### Session 15 (2026-05-13) — CLI Entry Point (Step 7)

**Completed:**

- Rewrote `src/index.ts` as full CLI entry point with argument parsing:
  - `--help`/`-h` flag shows usage text with mode descriptions and options
  - `--model <name>` flag overrides the default active model
  - **Mode 1 — one-shot:** positional prompt argument runs agent via `runAgent()`, prints final text to stdout, exits
  - **Mode 2 — interactive:** no prompt argument launches Ink TUI with `createElement(App)`
  - Error handling with appropriate exit codes
- Fixed build: added `react-devtools-core` as optional dependency (required by Ink bundling)
- Verified `bun build --compile` produces `tinycode.exe` successfully

**Files changed:**

- `src/index.ts` — rewritten from simple TUI render to full CLI entry point
- `package.json` — added `react-devtools-core` optional dep
- `PLAN.md` — checked off Step 7 items
- `CHANGELOG.md` — updated

### Session 16 (2026-05-13) — Groq Provider (default)

**Completed:**

- Installed `@ai-sdk/openai` dependency
- Created `src/llm/providers/groq.ts` — Groq provider using OpenAI-compatible API:
  - Uses `createOpenAI()` with `baseURL: "https://api.groq.com/openai/v1"`
  - Models: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`
  - Model configs with context limits and pricing
- Updated `src/llm/config.ts` — added `groq` to `PROVIDER_ENV` with `GROQ_API_KEY` env var and `keyUrl` for console.groq.com/keys; made config URLs dynamic per-provider
- Updated `src/llm/index.ts` — registered `groqProvider`, set `setActive("groq")` as default
- Updated `.env.example` — added `GROQ_API_KEY=`
- Verified `bun run build` succeeds (323 modules, ~617ms compile)

**Files changed:**

- `src/llm/providers/groq.ts` — created
- `src/llm/config.ts` — added groq env config, dynamic keyUrl
- `src/llm/index.ts` — register groq, set as default
- `.env.example` — added GROQ_API_KEY
- `package.json` — added @ai-sdk/openai
- `PLAN.md` — updated Step 2 with Groq provider
- `AGENTS.md` — updated state
- `CHANGELOG.md` — updated

### Session 17 (2026-05-13) — Build & Verify (Step 8)

**Completed:**

- Fixed `@ai-sdk/openai` version compatibility (v1.x for ai SDK v4, not v3)
- Rebuilt `tinycode.exe` successfully
- Verified all tests pass:
  - **one-shot:** `tinycode "say hello in one sentence"` → correct response
  - **read tool:** `tinycode "read src/index.ts and tell me what it does"` → read + summarize
  - **grep tool:** `tinycode "find all .ts files with 'export' in them and summarize"` → grep + summarize
  - **standalone:** binary runs from outside repo directory
- Marked Step 8 complete in PLAN.md

**Files changed:**

- `package.json` — changed @ai-sdk/openai from v3 to v1
- `PLAN.md` — checked off Step 8 items
- `AGENTS.md` — updated next step
- `CHANGELOG.md` — updated
