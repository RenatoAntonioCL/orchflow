# Architecture

## Overview

OrchFlow is an autonomous software development agency powered by LLMs. Given a brief in natural language, it coordinates specialized agents to produce a real software project. Communication follows the orchestrator pattern — agents never talk to each other directly.

## Structure

```
orchflow/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── types/              # Data contracts (ProjectBlueprint, AgentOutput, etc.)
│   │   │   ├── providers/          # LLM provider interface + implementations
│   │   │   │   ├── ollama.ts       # HTTP client for Ollama (localhost:11434)
│   │   │   │   └── mock.ts         # Predefined responses for tests
│   │   │   ├── agents/
│   │   │   │   ├── chief-architect/  # Brief → ProjectBlueprint
│   │   │   │   └── backend-dev/      # Blueprint → GeneratedFile[]
│   │   │   └── __tests__/          # Integration tests (real Ollama calls)
│   │   ├── vitest.config.ts        # Unit tests (excludes integration)
│   │   └── vitest.integration.config.ts
│   ├── cli/                        # (Phase 3) oclif CLI
│   ├── ui/                         # (Phase 3) React components
│   └── server/                     # (Phase 3) Optional Fastify API
├── apps/
│   └── desktop/                    # (Phase 3) Tauri app
├── docs/
│   └── adr/
└── pnpm-workspace.yaml
```

## Key decisions

| Decision | ADR |
|----------|-----|
| Hexagonal core, orchestrator pattern, no peer-to-peer agents | [ADR-0001](./docs/adr/ADR-0001-arquitectura-core.md) |

## Contracts

All contracts are defined in `packages/core/src/types/index.ts`:

- **Provider** — LLM abstraction: `complete(prompt) → { text, inputTokens, outputTokens }`
- **ProjectBlueprint** — Chief Architect output: project name, stack, agent plan, decisions, risks
- **GeneratedFile** — Developer output: `{ path, content, language, description }`
- **AgentOutput** — Standard agent result with files, decisions, notes, and metrics
- **RunResult** — Complete run result with QA report and scores

## Data flow

```
User brief (string)
    │
    ▼
ChiefArchitectAgent.run(brief, outputLevel)
    │  uses Provider.complete() with v1.prompt.ts
    ▼
ProjectBlueprint (JSON)
    │
    ▼
BackendDevAgent.run(blueprint)
    │  uses Provider.complete() with v1.prompt.ts
    ▼
GeneratedFile[] (JSON)
    │
    ▼
Files written to disk
```

Each agent call records `{ latencyMs, inputTokens, outputTokens, costUSD }`.
