# Context
HOW_I_WORK_VERSION: 0.3.0

## Current state

Project is in pre-Phase 0. Documentation structure is complete: MASTER_PLAN.md (v2.1), ARCHITECTURE.md, ADR-0001, CI pipeline. No source code yet.

## In progress

Phase 0 — Foundations: monorepo setup with pnpm workspaces + TypeScript, data contracts in `packages/core/src/types/`, first two agents (chief-architect, backend-dev).

## Known issues

- No source code exists yet — monorepo structure needs to be scaffolded
- CI pipeline defined but will fail until pnpm workspace and scripts are set up

## Working conventions

- Hexagonal Architecture: domain never imports infrastructure (see ADR-0001)
- Agent prompts are versioned files (`v1.prompt.ts`, `v2.prompt.ts`, `active.ts`)
- Orchestrator pattern only — no peer-to-peer agent communication
- LLM model IDs pinned with date, never floating aliases
- Two deployment modes: embedded (default, no Redis) and server (optional)
- `packages/core/src/actions/` is the single API surface for CLI and GUI parity

## Next steps

1. Scaffold pnpm monorepo (`pnpm-workspace.yaml`, `tsconfig.json`, ESLint, Prettier)
2. Define data contracts in `packages/core/src/types/index.ts`
3. Implement chief-architect agent with level 1 and 2 tests
4. Implement backend-dev agent with level 1 and 2 tests
5. Integration test: brief → files on disk
