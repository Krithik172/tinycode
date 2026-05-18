# Changelog

TinyCode is a lightweight TypeScript/Bun AI coding agent with a polished Ink/React multi-panel terminal UI. It features a provider-agnostic LLM architecture (Groq default, Gemini supported), clean tool definitions (read, write, bash, grep), session management with persistence, and an agentic loop with streaming UX. The TUI has a three-zone layout with header (token/cost metrics), conversation panel (chat bubbles, streaming markdown, scroll), preview panel (always-visible tool output with decorative separator), and footer (multi-line input with Shift+Enter newline, command support, keybinding hints). Kitty keyboard protocol is enabled for disambiguated modifier keys. The app compiles to a single standalone binary supporting both one-shot and interactive modes.

## Session: Cursor Focus Awareness

### Changes
- **Focus-aware cursor shape:** Filled teal `█` when terminal is focused and agent is idle; hollow gray `▯` when terminal loses focus (e.g., switching to another pane) or agent is running.
- **FocusFilterStream** (`src/tui/hooks/focus-filter.ts`): Custom `PassThrough` stream that intercepts stdin at the byte level. Focus report sequences (`\x1b[I` / `\x1b[O`) are consumed and never forwarded to Ink, preventing them from leaking into the prompt input display.
- **TerminalFocusProvider** (`src/tui/hooks/use-terminal-focus.tsx`): React context provider that enables focus reporting (`\x1b[?1004h`) on mount, registers a focus change listener, and disables it on exit (`\x1b[?1004l\x1b[0 q`).
- **App integration** (`src/tui/app.tsx`): Consumes `useTerminalFocus()` and passes combined `isInputActive && terminalFocused` to Footer.
- **PromptInput** (`src/tui/components/prompt-input.tsx`): Cursor shape driven by `isActive` prop — filled when active, hollow when inactive.
- **src/index.ts**: Wraps App with `TerminalFocusProvider`, passes filtered stdin to Ink's render.

### Files Changed
- `src/tui/hooks/focus-filter.ts` (new)
- `src/tui/hooks/use-terminal-focus.tsx` (new)
- `src/tui/app.tsx`
- `src/tui/components/prompt-input.tsx`
- `src/tui/components/footer.tsx`
- `src/index.ts`
- `AGENTS.md` (state updated)

### Decisions
- Initial approach of listening on `process.stdin.on("data")` in parallel with Ink's input handler caused focus sequences to leak through — Ink parsed them character-by-character.
- Second approach using `prependListener` broke Ink's raw mode initialization.
- Final approach: byte-level filter via `PassThrough` stream piped from `process.stdin`, consumed by Ink as the stdin source. Focus sequences are fully consumed before Ink's parser sees them.
- `ref`/`unref`/`setRawMode` delegated to underlying `process.stdin` with optional chaining (`?.`) for Windows/Bun compatibility.
