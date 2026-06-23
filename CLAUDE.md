# Project Context for Claude Code

## Project
OrchFlow — Autonomous software development agency powered by LLMs that coordinates specialized agents to deliver real software projects

## Owner
Renato Antonio — https://github.com/RenatoAntonioCL/how-i-work

## Stack
TypeScript 5, Node.js 20, pnpm monorepo, Anthropic Claude API, SQLite (Drizzle ORM), Docker (sandbox), Tauri (desktop), oclif (CLI), React 19, Tailwind, Zustand, Fastify (server mode), Vitest, ESLint, Prettier

## Structure
```
orchflow/
├── packages/
│   ├── core/          # Shared engine: orchestrator, agents, types, metrics
│   ├── cli/           # CLI with oclif — thin client over core
│   ├── ui/            # React components shared by the GUI
│   └── server/        # OPTIONAL: Fastify API + Bull + Redis (server mode)
├── apps/
│   └── desktop/       # Tauri app (Rust shell + React webview + core sidecar)
├── docker/            # Sandbox and server Dockerfiles
├── docs/
│   └── adr/           # Architecture Decision Records
└── pnpm-workspace.yaml
```

## Non-negotiables
- Branch protection on main — no direct pushes
- CI must be green before merge
- Tests must pass before merge
- No secrets in code — use environment variables
- Every significant decision gets an ADR
- Semantic versioning

## Conventions
- Commit format: type(scope): description (Conventional Commits)
- Branch format: feat/description, fix/description, docs/description
- PR template: .github/pull_request_template.md
- Commits NEVER include `Co-Authored-By` lines (no Claude/AI co-author) — ever
- Additional commit types: `prompt(agent)` for prompt changes, `eval(agent)` for evaluation results

## Current focus
Phase 0 — Foundations: monorepo setup, data contracts, chief-architect and backend-dev agents, integration tests

## What to avoid
- No peer-to-peer agent communication — orchestrator pattern only
- No floating LLM model aliases — pin with date (e.g. `claude-sonnet-4-6`)
- No Redis in embedded mode — in-memory queue only
- No Docker requirement for blueprint/scaffold levels
- See [ADR-0001](docs/adr/ADR-0001-arquitectura-core.md) for architecture rationale
