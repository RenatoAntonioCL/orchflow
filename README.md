# OrchFlow

> An **autonomous software development agency** powered by LLMs.
> Given a requirement in natural language, a team of specialized agents
> —with hierarchy, cross-reviews and defined roles— delivers a real
> software project: functional, documented and ready to continue.

![status](https://img.shields.io/badge/estado-planificaci%C3%B3n%20(pre--Fase%200)-orange)
![license](https://img.shields.io/badge/licencia-MIT-blue)
![plan](https://img.shields.io/badge/master%20plan-v2.1-success)

> 📄 This project is documented in English. The full technical plan is in
> **[`MASTER_PLAN.md`](./MASTER_PLAN.md)**.

---

## What it is

OrchFlow is **not** a scaffolding generator, a chatbot, or a LangChain wrapper.

It is a system where each agent has a role, responsibilities and acceptance criteria,
and can **reject or request revision** of other agents' work.
The user describes what they want, chooses how much should be built, and OrchFlow
coordinates the team to deliver it.

### Output levels (chosen by the user)

| Level | What it delivers | Est. time |
|-------|-----------------|-----------|
| `blueprint` | Architecture, ADRs, folder structure, API contracts | < 1 min |
| `scaffold` | + functional base code, configs, CI/CD, Dockerfile | 2–4 min |
| `mvp` | + auth, DB with migrations, tests, full README | 5–10 min |
| `deliverable` | + validations, error handling, logging, deploy-ready | 10–20 min |

### The agent team

```
            CHIEF ARCHITECT  (orchestrates, evaluates, assembles)
                   │
      ┌────────────┼─────────────┐
   Backend       Frontend       DevOps
    (TL+Dev)      (TL+Dev)     (CI/CD+Infra)
      └─────┬──────┘
            ▼
        QA / REVIEWER  →  TECH WRITER
```

---

## How it will be used

OrchFlow is distributed in two forms, with **full parity** (everything in the CLI is
also in the app):

- **CLI** — `npx orchflow new "REST API with JWT auth and PostgreSQL"`
- **Desktop app** — lightweight native installers (Tauri) for
  **Linux, macOS and Windows**

By default it runs in *embedded* mode (no server or Redis required): download and use.

---

## 🗺️ Roadmap — follow it week by week

Each phase ends with a **gate**: a binary question with executable evidence.
No phase advances without passing the gate.

| Phase | Week | Goal | Gate (how it is verified) | Status |
|-------|------|------|--------------------------|--------|
| **0** | 1 | Monorepo, types, first 2 agents | `pnpm test` green + real files generated | ⬜ Pending |
| **1** | 2–3 | Full team (without reviews) | Generated ZIP runs `npm install && build` without errors | ⬜ Pending |
| **2** | 4 | Cross-reviews + QA in sandbox | QA detects planted inconsistencies | ⬜ Pending |
| **3** | 5–6 | CLI + desktop app (parity) | Same run via CLI and GUI, without Redis | ⬜ Pending |
| **4** | 7 | All 4 output levels | Each level produces a distinct, coherent output | ⬜ Pending |
| **5** | 8 | Agent evolution + open source | System A/B rejects a worse prompt and promotes a better one | ⬜ Pending |

**Current status:** planning complete (Master Plan v2.1). Phase 0 about to start.

---

## How to follow the project

- ⭐ **Watch / Star** this repo to see each update.
- Check the **commits**: they use custom categories that make the evolution readable.
  - `prompt(<agent>): ...` — changes to an agent's prompt
  - `eval(<agent>): ...` — results of comparing versions of an agent
  - plus `feat`, `fix`, `test`, `refactor`, `docs`.
- Each agent will have its own `CHANGELOG.md` with scores per version.

---

## Stack (summary)

- **Core / engine:** Node.js 20 + TypeScript, Anthropic Claude API (with prompt caching)
- **Persistence:** SQLite (Drizzle ORM)
- **Validation sandbox:** Docker (tied to output level)
- **CLI:** oclif · **Desktop app:** Tauri (React + Tailwind)
- **Monorepo:** pnpm workspaces

Guiding principle: **maximize token and space efficiency** without sacrificing industry
standards or the goal of deploy-ready projects.

---

## Documentation

- 📘 **[`MASTER_PLAN.md`](./MASTER_PLAN.md)** — the full technical document:
  architecture, data contracts, gates, agent evolution, testing, metrics,
  infrastructure, distribution and phases.

---

## License

[MIT](./LICENSE)
