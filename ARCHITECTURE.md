# Architecture

## Overview

OrchFlow is an autonomous software development agency powered by LLMs. Given a requirement in natural language, it coordinates a team of specialized agents (Chief Architect, Developers, QA, Tech Writer) with hierarchy and cross-reviews to deliver a real software project — functional, documented and ready to continue.

The system uses Hexagonal Architecture: the domain (orchestration logic, agent contracts, scoring) has no knowledge of infrastructure (LLM providers, Docker, persistence). LLM providers are interchangeable adapters.

## Structure

```
orchflow/
├── packages/
│   ├── core/                    # Shared core logic
│   │   ├── src/
│   │   │   ├── orchestrator/    # Chief Architect + coordination
│   │   │   ├── agents/          # All agents (versioned prompts)
│   │   │   ├── evaluator/       # Brief analysis
│   │   │   ├── sandbox/         # Docker sandbox manager
│   │   │   ├── assembler/       # Final output assembly
│   │   │   ├── metrics/         # Metrics collection and persistence
│   │   │   ├── types/           # Shared interfaces and types
│   │   │   └── actions/         # Internal API consumed by CLI and GUI
│   │   └── package.json
│   ├── cli/                     # CLI with oclif — thin client over core
│   ├── ui/                      # React components shared by the GUI
│   └── server/                  # OPTIONAL: Fastify API + Bull + Redis
├── apps/
│   └── desktop/                 # Tauri app (Rust shell + React webview)
├── docker/
│   ├── Dockerfile.sandbox       # Validation image
│   ├── Dockerfile.server        # Server mode only
│   └── docker-compose.yml       # Server mode only
├── docs/
│   └── adr/                     # Architecture Decision Records
├── pnpm-workspace.yaml
└── package.json
```

## Key decisions

| Decision | ADR |
|----------|-----|
| TypeScript + pnpm monorepo + Hexagonal Architecture | [ADR-0001](docs/adr/ADR-0001-arquitectura-core.md) |

## Contracts

All agent communication flows through the Orchestrator (no peer-to-peer). Key data contracts:

- **ProjectBlueprint** — Chief Architect output: technical vision, stack, agent plan
- **AgentOutput** — Each agent's result: files, decisions, metrics (latency, tokens, cost)
- **RunResult** — Final assembly: all files, QA report with scores, output ZIP

Context passing is restrictive: each agent receives only its defined input. Unnecessary context = more expensive prompts and less focused outputs.

## Data flow

```
Brief (natural language) + OutputLevel
  → Chief Architect → ProjectBlueprint
    → [parallel] Backend Dev + Frontend Dev + DevOps
      → QA Reviewer (cross-validation in sandbox)
        → Tech Writer
          → Assembler → ZIP output
```

Checkpointing: run state is persisted in SQLite as it progresses. Retries resume from the last completed agent.
