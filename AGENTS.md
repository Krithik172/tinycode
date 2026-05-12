# AGENTS.md

## Project Goal

TinyCode is a minimal open-source AI coding agent built in TypeScript/Bun.
It implements the core OpenCode architecture — an agentic loop with tool
calling — but with a custom terminal UI and limited toolset (read, write,
bash, grep). It compiles to a single binary and runs interactively or with
one-shot prompts, powered by Google Gemini via the Vercel AI SDK.

## Workflow Rules

1. Read PLAN.md at the start of every session before any other action.
2. Read PLAN.md before beginning any new feature or task.
3. Update PLAN.md after completing a step — check the box and move on.
4. If unsure about what to do next — PLAN.md is the source of truth.

## State

- Repository scaffold complete: package.json, tsconfig.json, .gitignore
- Dependencies installed: ai, @ai-sdk/google, zod, chalk (Bun v1.3.13)
- Git repo initialized, no commits yet.
- No source files written yet.

## Conventions

- All tools auto-approve (safe because work is scoped to this repo).
- First task for any session is to read PLAN.md.
