# AGENTS.md

## Project Goal

TinyCode is a beautiful, lightweight open-source AI coding agent built in TypeScript/Bun.
It implements the core OpenCode architecture — an agentic loop with tool calling — but with a
polished Ink/React multi-panel terminal UI. Features a provider-agnostic LLM architecture
(easily add OpenAI, Anthropic, etc. by dropping in a provider file), clean minimal design,
smooth streaming UX, and a focused tool preview panel. Compiles to a single binary, runs
interactively or with one-shot prompts, powered by the Vercel AI SDK.

## Workflow Rules

1. Read PLAN.md at the start of every session before any other action.
2. Read PLAN.md before beginning any new feature or task.
3. Update PLAN.md after completing a step — check the box and move on.
4. Log session details (completed items, decisions, files changed) in CHANGELOG.md — not in PLAN.md.
5. If unsure about what to do next — PLAN.md is the source of truth.

## State

- Repository scaffold complete: package.json, tsconfig.json, .gitignore
- Dependencies installed: ai, @ai-sdk/google, zod, chalk, ink, react (Bun v1.3.13)
- Git repo initialized, no commits yet.
- LLM provider architecture in place: src/llm/ (config.ts, types.ts, providers/gemini.ts, providers/groq.ts, index.ts)
- .env.example created with GOOGLE_API_KEY=, GROQ_API_KEY= references
- Session management in place: src/session.ts (Message types, Session class, system prompt builder, persistence)
- Agent loop in place: src/agent.ts (runAgent, tool conversion, fullStream processing, session persistence)
- Terminal UI in place: src/tui/ (Ink/React multi-panel TUI with conversation, preview, input, streaming)
- **UI enhancements:** Header now shows token breakdown + context % + cost; markdown renders during streaming; proper line breaks between blocks
- **UI polish:** Thin single-line border on footer (was bold); chat window anchored to bottom with `justifyContent="flex-end"`
- **Chat bubble layout:** User messages right-aligned with background-fill bubble; assistant messages left-aligned, no box
- **Multi-line input:** Shift+Enter / Ctrl+Enter inserts newline; each line rendered separately with `>` prefix on first
- **Chat scrolling:** PageUp/PageDown to scroll through history; auto-scroll on new messages when at bottom
- **Overflow fix:** Root layout has `overflow="hidden"`; conversation panel uses fixed computed height
- **Step 7 done:** src/index.ts rewritten as CLI entry point (--help, --model, one-shot, interactive modes)
- **Groq provider added:** src/llm/providers/groq.ts (OpenAI-compatible, llama-3.3-70b-versatile) — set as default
- **Step 8 done:** All build and verification tests passing — one-shot, read tool, grep tool, standalone binary
- **Step 9 done:** UI polish — chat bubbles, multi-line input, scrolling, overflow fix
- **Preview panel:** Always visible by default, Ctrl+B to close; decorative separator line between chat and preview
- **Next up:** Future enhancements / polish

## Conventions

- All tools auto-approve (safe because work is scoped to this repo).
- First task for any session is to read PLAN.md.
- TUI is built with Ink + React — components in `src/tui/`
- Backend (tools, session, agent) built before TUI
- Session persistence to `.tinycode/sessions/` as JSON
