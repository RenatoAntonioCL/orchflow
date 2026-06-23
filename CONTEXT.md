# Context
HOW_I_WORK_VERSION: 0.3.0

## Current state

Phase 0 complete. Working monorepo with:
- pnpm workspaces + TypeScript 5 + ESLint 9 + Prettier + Vitest
- Data contracts: `AgentId`, `AgentRole`, `OutputLevel`, `ProjectBlueprint`, `AgentOutput`, `GeneratedFile`, `RunResult`, `Provider`
- Provider interface with `OllamaProvider` (HTTP) and `MockProvider` (no network)
- `chief-architect` agent: brief → `ProjectBlueprint` (v1 prompt)
- `backend-dev` agent: blueprint → `GeneratedFile[]` (v1 prompt)
- 13 unit tests (Level 1 + 2), all passing
- Integration test: Ollama qwen2.5-coder:7b → real files on disk at `/tmp/orchflow-test/`

## In progress

Nothing active. Phase 0 gate passed, ready for Phase 1.

## Known issues

- Integration test takes ~100-160s on local Ollama (qwen2.5-coder:7b inference speed)
- No Claude API integration yet — Ollama only
- No `active.ts` re-export pattern for agents yet (only v1 prompt files exist)

## Working conventions

- Agents use the `Provider` interface, never import a specific provider directly
- Unit tests always use `MockProvider`, integration tests use `OllamaProvider`
- Prompts live in versioned `v{n}.prompt.ts` files, separate from agent logic
- JSON parsing in agents handles markdown code block wrapping as fallback
- Each agent records metrics: `latencyMs`, `inputTokens`, `outputTokens`, `costUSD`

## Next steps

Phase 1 — Full Team:
1. Frontend Developer agent
2. DevOps (CI/CD + Infra) agent
3. Tech Writer agent
4. Assembler (file consolidation)
5. Functional ZIP output
6. Basic metrics system
