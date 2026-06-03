# OrchFlow — Complete Master Plan
# Version 2.1 — Definitive document for implementation

> This document defines exactly what OrchFlow is, how it is structured,
> its quality gates, evolution strategy, testing, metrics, memory,
> infrastructure and contribution structure.
> Intended for: Claude Code / technical implementation and ongoing project reference.

---

## TABLE OF CONTENTS

1. Product Vision
2. Agent Hierarchy
3. System Architecture
4. Data Contracts
5. Quality Gates Between Phases
6. Agent Evolution — Continuous Improvement
7. Testing Strategy
8. Performance Metrics
9. Memory and Context Model
10. Infrastructure — Deployment Modes and What Goes in Which Version
11. Sandbox — Validation Tied to Output Level
12. Review System
13. CLI + Desktop App — Interface and Parity
14. GUI — Screens
15. Distribution and Installers
16. Token Economy
17. Implementation Phases
18. Structure for Continuous Contribution
19. Key Technical Decisions
20. What OrchFlow Does Not Do (Explicit Scope)
21. Instructions for Claude Code

---

## 1. PRODUCT VISION

OrchFlow is an **autonomous software development agency** powered by LLMs.

Given a requirement in natural language, OrchFlow coordinates a team of specialized
agents with hierarchy, cross-reviews and defined roles to deliver a real software
project — functional, documented and ready to continue.

**It is not**: a scaffolding generator, a chatbot, or a LangChain wrapper.

**It is**: a system where each agent has a role, responsibilities, acceptance criteria,
and can reject or request revision of other agents' work.

### User-configurable output

The user chooses the completeness level before running:

| Level | Name         | Description                                                          | Est. time   |
|-------|--------------|----------------------------------------------------------------------|-------------|
| 1     | `blueprint`  | Architecture, ADRs, folder structure, API contracts                  | < 1 min     |
| 2     | `scaffold`   | Level 1 + functional base code, configs, CI/CD, Dockerfile           | 2–4 min     |
| 3     | `mvp`        | Level 2 + auth, DB with migrations, tests, full README               | 5–10 min    |
| 4     | `deliverable`| Level 3 + validations, error handling, logging, deploy-ready         | 10–20 min   |

---

## 2. AGENT HIERARCHY

```
┌─────────────────────────────────────────┐
│           CHIEF ARCHITECT               │  ← Receives the brief, defines the
│     (Orchestrator / Evaluator)          │     technical vision, assigns work
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼─────────────┐
    ▼            ▼             ▼
┌────────┐  ┌────────┐  ┌──────────┐
│  TECH  │  │  TECH  │  │  TECH    │
│ LEAD   │  │ LEAD   │  │ LEAD     │
│Backend │  │Frontend│  │ DevOps   │
└───┬────┘  └───┬────┘  └────┬─────┘
    │            │             │
    ▼            ▼             ▼
┌────────┐  ┌────────┐  ┌──────────┐
│Backend │  │Frontend│  │CI/CD     │
│ Dev    │  │ Dev    │  │+ Infra   │
└────────┘  └────────┘  └──────────┘
    │            │
    └─────┬──────┘
          ▼
┌────────────────────┐
│    QA / Reviewer   │  ← Reviews output from all devs
└────────────────────┘
          │
          ▼
┌────────────────────┐
│    TECH WRITER     │  ← Documents the complete project at the end
└────────────────────┘
```

### Roles and responsibilities

**Chief Architect (Orchestrator)**
- Receives the user's brief
- Produces `ProjectBlueprint` (technical vision, stack, output level)
- Assigns tasks to Tech Leads with specific context
- Receives final outputs and performs assembly
- Can reject an output and re-assign with feedback

**Tech Lead (Backend / Frontend / DevOps)**
- Receives the blueprint from the Chief Architect
- Defines the architecture specific to their area
- Delegates implementation to the Developer in their area
- Reviews the Developer's output before passing it to QA
- Can request rework from the Developer (max. 2 iterations)

**Developer (Backend / Frontend)**
- Receives specifications from the Tech Lead
- Generates real code (concrete files)
- Delivers output to the Tech Lead for review

**CI/CD + Infra Agent**
- Works in parallel with the Backend Dev
- Generates Dockerfile, docker-compose, GitHub Actions workflows
- Synchronizes with the Backend output to use the same commands

**QA / Reviewer Agent**
- Receives all outputs from Developers
- Verifies cross-consistency
- Verifies that the project compiles (runs real commands in the sandbox)
- Generates an issue report — critical issues block delivery

**Tech Writer**
- Receives the complete project
- Generates README.md, CONTRIBUTING.md, API documentation
- Is the last agent to execute

### Canonical agent list (single source of truth)

These are the only agents that exist in v1. Any other mention in this
document (e.g.: "Core Dev", "Security Agent", "testing agent") is an alias or
future work and must be normalized to this table:

| AgentId            | Role            | Alias / notes                              |
|--------------------|-----------------|--------------------------------------------|
| `chief-architect`  | Orchestrator    | —                                          |
| `backend-tl`       | Tech Lead       | —                                          |
| `frontend-tl`      | Tech Lead       | —                                          |
| `devops`           | DevOps          | "CI/CD + Infra agent"                      |
| `backend-dev`      | Developer       | NEVER "Core Dev" — use `backend-dev`       |
| `frontend-dev`     | Developer       | —                                          |
| `qa`               | QA / Reviewer   | absorbs testing and security checks        |
| `tech-writer`      | Tech Writer     | —                                          |

A dedicated `security-agent` is v2 work; in v1 security checks
(dependencies, exposed endpoints) are handled by the `qa` agent.

> **Design note — the Tech Lead layer is measured before being taken for granted.**
> Each Tech Lead that delegates and then reviews adds 2+ extra LLM calls. With the
> `< $0.50` and `< 5 min` targets (§8), that layer may not justify its cost.
> Phase 1 is implemented first WITHOUT Tech Leads (Architect → Dev → QA); Tech
> Leads are added only if metrics show they improve `coherence` more than they
> cost in latency and tokens. Same principle as infrastructure (§10):
> a component is added when it solves a problem that already exists, not a hypothetical one.

---

## 3. SYSTEM ARCHITECTURE

### 3.1 OrchFlow Technology Stack

**Core (engine shared by CLI and GUI)**
- Runtime: Node.js 20 + TypeScript 5
- LLM: Anthropic Claude API — model id pinned with date (e.g.: `claude-sonnet-4-6`), never a floating alias (see §6, model pinning); system prompt caching (§16)
- Queue: in-memory in embedded mode; Bull + Redis in server mode only
- Storage: SQLite via Drizzle ORM (runs, metrics, agent history)
- Sandbox: dockerode (Docker SDK for Node.js), tied to output level (§11)
- HTTP API (Fastify): server mode only (optional, §10)

**GUI / Desktop App (Tauri)**
- Shell: Tauri (Rust) — small installers (~5–10 MB), uses the system webview
- UI: React 19 + TypeScript + Tailwind + Zustand
- Engine: `core` (Node/TS) runs as a **sidecar** launched by Tauri
- Realtime: sidecar events → UI (IPC); SSE in server mode only
- Chosen for minimal footprint (see §16, token and space economy)

**CLI**
- Framework: oclif (production-grade CLI framework)
- Thin client over `core` — same logic as the GUI (parity by construction)

**Deployment modes**
- **Embedded** (default): in-process engine, no Redis or server. Used by
  CLI and GUI. "Download & run" without starting anything (except Docker if the level requires it).
- **Server** (optional/advanced): Fastify API + Bull + Redis + SSE, for
  repeated or multi-job use. Not required to use OrchFlow.
- Docker is used for the validation sandbox, tied to the output level (see §11).

### 3.2 Monorepo Structure

```
orchflow/
├── packages/
│   ├── core/                    # Shared core logic
│   │   ├── src/
│   │   │   ├── orchestrator/    # Chief Architect + coordination
│   │   │   ├── agents/          # All agents
│   │   │   │   └── backend-dev/
│   │   │   │       ├── v1.prompt.ts
│   │   │   │       ├── v2.prompt.ts
│   │   │   │       ├── active.ts
│   │   │   │       └── CHANGELOG.md
│   │   │   ├── evaluator/       # Brief analysis
│   │   │   ├── sandbox/         # Docker sandbox manager
│   │   │   ├── assembler/       # Final output assembly
│   │   │   ├── metrics/         # Metrics collection and persistence
│   │   │   └── types/           # Shared interfaces and types
│   │   └── package.json
│   │   └── actions/         # Internal API consumed by CLI and GUI (parity)
│   ├── cli/                     # CLI with oclif — thin client over core
│   ├── ui/                      # React components shared by the GUI
│   └── server/                  # OPTIONAL: Fastify API + Bull + Redis (server mode)
├── apps/
│   └── desktop/                 # Tauri app (Rust shell + React webview + core sidecar)
├── docker/
│   ├── Dockerfile.sandbox       # validation image (with package mirror)
│   ├── Dockerfile.server        # server mode only
│   └── docker-compose.yml       # server mode only
├── docs/
├── pnpm-workspace.yaml
└── package.json
```

`packages/core/src/actions/` is the **only surface** invoked by both the CLI
and the GUI (`new`, `plan`, `history`, `metrics`, `evalCompare`). A new action
is added here once and becomes available in both. If an action exists only in one
adapter, it is a parity bug.

### 3.3 Execution Flow

```
1. Input (CLI or GUI)
   └── brief: string
   └── outputLevel: 'blueprint' | 'scaffold' | 'mvp' | 'deliverable'

2. API receives the job → enqueues in Bull → responds with jobId

3. Worker picks up the job:
   a. Chief Architect evaluates the brief → ProjectBlueprint
   b. Chief Architect opens a Docker sandbox for the run
   c. Runs agents in order (with parallelism where applicable):
      ├── [parallel] Backend TL + Frontend TL + DevOps Agent
      ├── [parallel] Backend Dev + Frontend Dev
      │     - Frontend Dev works against the Backend TL's API CONTRACT
      │       (endpoints and types), NOT against Backend Dev's output. That is
      │       why they can run in parallel. If the TL's contract and what the
      │       Dev produces diverge, QA reconciles it.
      ├── QA Reviewer (after all devs)
      └── Tech Writer (last)
   d. Assembler consolidates all files in the sandbox
   e. QA runs real validations (npm install, build, lint)
   f. Final output: project ZIP

   Checkpointing: the run state (outputs of each completed agent) is
   persisted in SQLite as it progresses. If the job fails and Bull retries it,
   it resumes from the last completed agent — already-successful agents are NOT
   re-executed. Without this, each retry would duplicate the token cost of the entire run.

4. Run metadata saved in SQLite

5. Metrics recorded (build success, scores, latency, cost)
```

---

## 4. DATA CONTRACTS

### Base types

```typescript
type AgentId =
  | 'chief-architect' | 'backend-tl' | 'frontend-tl' | 'devops'
  | 'backend-dev' | 'frontend-dev' | 'qa' | 'tech-writer';

type AgentRole =
  | 'orchestrator' | 'tech-lead' | 'developer' | 'devops' | 'qa' | 'tech-writer';

type OutputLevel = 'blueprint' | 'scaffold' | 'mvp' | 'deliverable';
```

All contracts carry `_version` to allow future migrations.

### ProjectBlueprint

```typescript
interface ProjectBlueprint {
  _version: '1.0';
  id: string;
  createdAt: Date;

  name: string;
  description: string;
  projectType: 'webapp' | 'api' | 'fullstack' | 'cli' | 'microservice' | 'library';

  outputLevel: OutputLevel;
  difficulty: 'low' | 'medium' | 'high' | 'critical';
  estimatedMinutes: number;
  estimatedCostUSD: number;

  stack: {
    language: string;
    runtime: string;
    framework: string;
    database?: string;
    queue?: string;
    cache?: string;
    frontend?: string;
  };

  agentPlan: AgentPlanStep[];
  architectureDecisions: string[];
  risks: string[];
}

interface AgentPlanStep {
  agentId: AgentId;
  role: AgentRole;
  dependsOn: AgentId[];
  canRunParallel: boolean;
  context: string;
}
```

### AgentOutput

```typescript
interface AgentOutput {
  _version: '1.0';
  agentId: AgentId;
  role: AgentRole;
  status: 'success' | 'failed' | 'rejected';
  promptVersion: string;       // e.g.: 'v2' — to correlate with metrics
  files: GeneratedFile[];
  decisions: string[];
  notes: string;
  reviewFeedback?: string;
  metrics: {
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
  };
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description: string;
}
```

### RunResult

```typescript
interface RunResult {
  _version: '1.0';
  runId: string;
  blueprint: ProjectBlueprint;
  status: 'completed' | 'partial' | 'failed';

  totalFiles: number;
  totalAgentCalls: number;
  totalTokensUsed: number;
  actualCostUSD: number;
  durationMs: number;

  qaReport: {
    passed: boolean;
    buildSuccess: boolean;
    checks: QACheck[];
    criticalIssues: string[];
    warnings: string[];
    // Unified score vocabulary (see §6 and §8).
    // correctness, completeness and coherence are DETERMINISTIC (build/parser);
    // quality is the only dimension evaluated by LLM-as-a-Judge.
    scores: {
      correctness: number;    // 0–1  deterministic: build/tsc passes
      coherence: number;      // 0–1  deterministic: valid cross-references (= "consistency" from §8)
      completeness: number;   // 0–1  deterministic: files present / expected
      quality: number;        // 0–1  LLM-as-a-Judge: stack best practices
    };
  };

  outputZipPath: string;
}
```

---

## 5. QUALITY GATES BETWEEN PHASES

A gate is a **binary question with executable evidence**.
If you cannot answer "yes" with a command or a test, it does not pass.

### Gate 0 → 1
**Question**: Does `pnpm test` pass AND are real files generated in `/tmp/orchflow-test/`?

```bash
# Required evidence:
pnpm test                          # all tests green
ls /tmp/orchflow-test/package.json # real file exists
```

Not acceptable: "the code looks good" / "I think it works".

### Gate 1 → 2
**Question**: Does the generated ZIP run `npm install && npm run dev` without errors in a clean environment?

```bash
# Required evidence:
unzip output.zip -d /tmp/test-project
cd /tmp/test-project
npm install   # exit code 0
npm run build # exit code 0
```

Not acceptable: files existing but not running.

### Gate 2 → 3
**Question**: Does the QA Agent detect at least 1 real inconsistency in a project with deliberately planted errors?

```bash
# Required evidence:
pnpm test:qa --fixture broken-project
# The report must list the planted error as a critical issue
```

Not acceptable: QA running without errors but detecting nothing.

### Gate 3 → 4
**Question**: Can the same project be generated via CLI and via the desktop app,
with identical output, without starting Redis?

```bash
# Required evidence (embedded mode):
npx orchflow new "..." --level scaffold -o /tmp/cli-run   # valid ZIP, no Redis
# and the SAME brief from the desktop app → generates the same project
# Full flow in both: brief → generation → valid ZIP
```

Not acceptable: UI existing but the full flow failing, or CLI and GUI differing.

### Gate 4 → 5
**Question**: Do all 4 levels produce distinct outputs coherent with their definition?

```bash
# Required evidence:
# blueprint: only docs/architecture, no code
# scaffold: base code that compiles
# mvp: includes auth and DB
# deliverable: includes tests and error handling
pnpm test:levels # specific suite that verifies each level
```

Not acceptable: all levels generating the same thing under different names.

### Gate 5 → release
**Question**: Does the evolution system automatically reject a worse prompt
and promote a better one, over the benchmark set, with a statistical criterion?

```bash
# Required evidence:
pnpm eval:regression --agent backend-dev --version vTEST --baseline active
# Deliberately plant a worse vTEST → it must be REJECTED.
# Plant a better vTEST (improvement > threshold and outside the deviation) → it must be PROMOTED.
```

Not acceptable: the command running but promoting/rejecting without checking variance.

---

## 6. AGENT EVOLUTION — CONTINUOUS IMPROVEMENT

### Layer 1 — Prompt Versioning

Each prompt lives in a versioned file. Changing a prompt = new file, never overwrite.

```
packages/core/src/agents/backend-dev/
  v1.prompt.ts     ← original version
  v2.prompt.ts     ← first iteration
  active.ts        ← re-exports v2 as default
  CHANGELOG.md     ← history with scores per version
```

Agent `CHANGELOG.md`:
```markdown
## v2 (2025-07-15)
- Improved: more specific folder structure instruction
- Build success rate: 91% (+12% vs v1)
- Coherence score: 0.88 (+0.09 vs v1)

## v1 (2025-06-01)
- Initial version
- Build success rate: 79%
- Coherence score: 0.79
```

### Layer 2 — Scoring (deterministic first, LLM judge only where needed)

After each run the output is scored across 4 dimensions. **Three of the four
are deterministic** — measured by the sandbox/parser, NOT an LLM. Using a judge for
syntactic validity would be more expensive and less reliable than running the build.

| Dimension    | How it is measured                                      | Type           | Target |
|--------------|---------------------------------------------------------|----------------|--------|
| Correctness  | `tsc`/`build` passes in the sandbox                     | DETERMINISTIC  | > 0.95 |
| Completeness | files present / expected files                          | DETERMINISTIC  | > 0.85 |
| Coherence    | valid cross-references (imports, endpoints, env vars)   | DETERMINISTIC  | > 0.88 |
| Quality      | follows best practices for the chosen stack             | LLM-as-a-Judge | > 0.80 |

Only `Quality` requires the LLM judge agent. Deterministic checks reuse
exactly the same logic as the QA Agent (§12) — one implementation, two consumers.

Scores are stored in SQLite associated with `(agentId, promptVersion, projectType)`
and are the **single source of truth**. The scores block in each agent's `CHANGELOG.md`
is GENERATED from SQLite (not written by hand) so they never diverge.

### Layer 3 — A/B Experiments

When two versions of a prompt exist:
1. Run both over the benchmark set, with **k=3 runs per brief** (fixed seeds)
   to measure variance, not a single sample.
2. Compare **mean ± standard deviation** per dimension, not just the average.
3. The new version becomes `active` only if its improvement exceeds 5% **and** the
   interval does not overlap with the baseline's (the improvement is outside the noise).
4. Validate against the **held-out set** before promoting: if it improves on the benchmark
   but not on the held-out, it is overfitting → discard.
5. If it does not pass: document in the CHANGELOG and discard.

**Model pinning:** the model id is pinned with a date (e.g.: `claude-sonnet-4-6`),
never a floating alias. If the model changes, historical scores are no longer
comparable and re-baselining is required — an immutable benchmark only makes sense
with a fixed model.

The benchmark set is `packages/core/src/benchmarks/briefs.ts` with 10 representative
briefs. It is immutable — always the same for fair comparison.
There is also a **held-out set** (`briefs.holdout.ts`, another 5 briefs) that is NEVER
used to decide `active`, only to detect overfitting on the 10 benchmark briefs.

---

## 7. TESTING STRATEGY

### Level 1 — Structure Tests (fast, no API)

Verify that the output has the correct shape regardless of content.
No LLM calls — uses mocked outputs.

```typescript
describe('BackendDevAgent output structure', () => {
  it('returns required fields', async () => {
    const output = await runWithMock(backendDevAgent, mockInput)
    expect(output).toHaveProperty('files')
    expect(output.files.length).toBeGreaterThan(0)
    expect(output.files[0]).toHaveProperty('path')
    expect(output.files[0]).toHaveProperty('content')
    expect(output.metrics).toHaveProperty('latencyMs')
  })
})
```

### Level 2 — Contract Tests (fast, no API)

Verify business invariants: certain files must always exist
for certain project types.

```typescript
describe('Node.js project contracts', () => {
  it('always generates package.json', () => {
    const files = mockNodeOutput.files.map(f => f.path)
    expect(files).toContain('package.json')
    expect(files).toContain('.env.example')
    expect(files).toContain('Dockerfile')
  })
})
```

### Level 3 — Compilation Tests (sandbox, on demand)

The generated code actually compiles. Run by the QA Agent in the Docker sandbox.

```bash
# Inside the sandbox:
npm install --silent && npm run build
# Exit code 0 = test passes
# Exit code != 0 = critical issue recorded
```

When they run: on a real run execution, and at Gate 1→2.

### Level 4 — Quality Regression Tests (with API, on releases)

After each prompt change, run the full benchmark set and compare
scores with the previous version. If the average score drops more than 5%, the change
is not merged.

```bash
pnpm eval:regression --agent backend-dev --version v3 --baseline v2
# Output: comparative score table by dimension and project type
```

### Test Distribution in CI

```
Each commit   → Level 1 + Level 2 (seconds, free)
Each PR       → Level 1 + Level 2 + Level 3 on 2 fixtures
              + smoke-eval (reduced Level 4: 1–2 briefs) if the PR touches a .prompt.ts
Each release  → All levels + full regression
```

The smoke-eval on PR exists because Level 1/2 tests use mocked outputs:
they test the harness, not agent quality. Without it, a quality regression
from a prompt change goes unnoticed until release. It only runs when the
diff touches a `.prompt.ts` file, to avoid burning tokens unnecessarily.

---

## 8. PERFORMANCE METRICS

### Product Metrics

| Metric                | Definition                                          | Target v1 | Target v2 |
|-----------------------|-----------------------------------------------------|-----------|-----------|
| Build success rate    | % of projects that compile without errors           | 80%       | 92%       |
| File completeness     | files present / expected files                      | > 0.85    | > 0.93    |
| Consistency score     | valid cross-references between files                | > 0.88    | > 0.95    |
| Time to usable        | minutes from brief to a running project             | < 5 min   | < 3 min   |

### System Metrics

| Metric                | Definition                                          | Target    |
|-----------------------|-----------------------------------------------------|-----------|
| Cost per run          | USD per run at scaffold level                       | < $0.50   |
| Agent success rate    | % of agents that complete without retry             | > 95%     |
| Review rejection rate | % of outputs rejected by Tech Lead                  | (monitor) |
| p95 latency/agent     | 95th percentile time per agent                      | < 15s     |

`review_rejection_rate` has no target — it is a diagnostic indicator.
If an agent has > 30% rejections, the prompt needs urgent revision.

### Metrics Storage

All metrics go to SQLite in the `agent_metrics` table. The schema is defined
with Drizzle (the SQL below is the resulting form, for reference):

```sql
CREATE TABLE agent_metrics (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL,
  agent_id    TEXT NOT NULL,
  prompt_ver  TEXT NOT NULL,
  project_type TEXT NOT NULL,
  latency_ms  INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd    REAL,
  correctness REAL,
  coherence   REAL,
  completeness REAL,
  quality     REAL,
  build_success INTEGER,  -- 0 or 1
  rejected    INTEGER,    -- 0 or 1
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for the main query pattern (evolution by agent/version/type):
CREATE INDEX idx_agent_metrics_lookup
  ON agent_metrics (agent_id, prompt_ver, project_type);
```

The GUI has a metrics screen showing evolution by agent and version.

---

## 9. MEMORY AND CONTEXT MODEL

### Three Types of Information

**Run context** — in memory during execution, discarded when done

The `ExecutionContext` that the Orchestrator passes to each agent. Includes the full
blueprint and the outputs of previous agents according to the dependency graph.

**Project context** — persisted in SQLite

The *record* of previous runs is stored in SQLite from v1 (it is cheap). The
*consumption* of that history by the Chief Architect — e.g.: "which stack had the best
build success rate for `api` projects in the last 30 runs?" — is accumulated learning
without fine-tuning, and is **v2 work** (see §20). In v1 each run is
independent; data is only accumulated to enable it later.

**Agent context** — version history with scores

The system knows which version of each agent performs best and uses it.
Stored in SQLite + the `active.ts` files for each agent.

### Context Passing Rules

Context passing between agents is deliberately restrictive.
Unnecessary context = more expensive prompts and less focused outputs.

```
Chief Architect  → all:              full blueprint
Backend TL       → Frontend Dev:     API contract (endpoints and types)
Backend Dev      → DevOps:           build and test commands
Backend Dev      → QA:               expected file structure
                                     (QA also reviews dependencies and exposed
                                      endpoints — no security agent in v1)
All              → Tech Writer:      complete outputs
```

If an agent needs information that is not in its defined input,
the design is wrong — adjust the graph, do not add more context.

**Context window in large projects:** Tech Writer, Assembler and QA receive
"complete outputs", which in a large `deliverable` may exceed the context
window. Strategy: these agents receive a MANIFEST (file tree +
signatures/exports + decisions), not the literal content of each file, and request
the content of a specific file only when needed. The entire project is never
stuffed into a single prompt.

### Dependency Graph

```
chief-architect ─► backend-tl  ─► backend-dev ──┐
                ├─► frontend-tl ─► frontend-dev ─┤
                └─► devops                       │
                                                 ▼
                                                qa ─► tech-writer
```

frontend-dev depends on the backend-tl CONTRACT (not on backend-dev), which is why
backend-dev and frontend-dev run in parallel (see §3.3). qa receives the outputs
of all devs + devops; tech-writer is last and receives everything.

---

## 10. INFRASTRUCTURE — DEPLOYMENT MODES AND WHAT GOES IN WHICH VERSION

The rule: **a technology is added when it solves a problem that already exists,
not a problem that might exist.**

### Two Deployment Modes

OrchFlow runs in two modes on the same `core`. The primary distribution
(CLI + GUI) uses **embedded**; **server** mode is optional for advanced use.

| Aspect         | Embedded (default)                  | Server (optional)                      |
|----------------|-------------------------------------|----------------------------------------|
| How it starts  | CLI / desktop app                   | `docker compose up` or `orchflow serve` |
| Engine         | in-process (in the process/sidecar) | Fastify API + worker                   |
| Job queue      | in-memory (1 run at a time by default) | Bull + Redis                        |
| Streaming      | IPC events → UI                     | SSE                                    |
| Dependencies   | Docker only if the level requires it (§11) | Docker + Redis                   |
| Use case       | "download & run", personal use      | repeated use, multi-job, future cloud  |

Key consequence: **Redis is no longer a v1 requirement.** A user who installs
the app or the CLI does not need to start anything to generate a project.

### v1 — What Is Built Now

| Technology     | Why in v1                                            |
|----------------|------------------------------------------------------|
| Docker         | Validation sandbox — only when the level requires it (§11) |
| In-memory queue| Sufficient for single-user embedded mode             |
| SQLite         | Run and metrics persistence — zero config            |
| Tauri          | Cross-platform desktop app with minimal footprint (§15) |
| oclif          | Thin CLI client over core                            |
| Error logging  | Basic observability — know what fails and why        |
| GitHub Actions | CI/CD for OrchFlow itself                            |
| (server opt.)  | Fastify + Bull + Redis + SSE — only if server mode is used |

### v2 — When OrchFlow Has Real Users

| Technology     | Trigger for adoption                                 |
|----------------|------------------------------------------------------|
| Redis caching  | When similar runs repeat frequently                  |
| WebSockets     | If SSE shows limitations in production               |
| S3             | When ZIPs need persistent storage                    |
| PostgreSQL     | When SQLite shows contention with multiple users     |
| RabbitMQ/SQS   | When there are work queues across multiple workers   |

### v3 — If OrchFlow Becomes a Platform

| Technology     | Trigger for adoption                                 |
|----------------|------------------------------------------------------|
| Kubernetes     | When horizontal scaling is needed                    |
| Load balancer  | When there is real traffic to distribute             |
| Sharding       | When the DB has millions of runs                     |
| Encryption     | When there is user data in production                |
| CDN            | When the hosted GUI web has global users             |

### Never in OrchFlow (with Justification)

| Technology  | Why not                                              |
|-------------|------------------------------------------------------|
| FTP         | No legacy file transfer                              |
| DynamoDB    | SQLite → PostgreSQL is the natural path, not NoSQL   |
| TensorFlow  | Evaluation models are external LLMs, not custom ML   |

---

## 11. SANDBOX — VALIDATION TIED TO OUTPUT LEVEL

The Docker sandbox is not all-or-nothing: it is used **only when the output level
justifies it**. This way a user who wants a `blueprint` or `scaffold` does not need
Docker installed, and real isolation is only paid for deploy-ready outputs.

| Level         | Validation                               | Docker?  |
|---------------|------------------------------------------|----------|
| `blueprint`   | none (docs/architecture only)            | No       |
| `scaffold`    | lightweight: build in a subprocess isolated from the host | No |
| `mvp`         | real: install + build + tests            | **Yes**  |
| `deliverable` | real + deploy-ready artifacts (Dockerfile, healthcheck, env, CI passes) | **Yes** |

The app/CLI **detects Docker** at startup. If a user requests `mvp`/`deliverable`
and Docker is missing, it guides them to install it (does not fail silently or degrade without warning).
Server mode always uses Docker.

> "Deploy-ready" (industry standard) is not just that it compiles: the `devops`
> agent produces Dockerfile, healthcheck, environment variables and CI, and the
> `deliverable` validation checks them — not just `npm run build`.

### Docker Sandbox Details (mvp/deliverable levels)

```
Base image: orchflow/sandbox:latest
  - Node.js 20 + pnpm
  - Python 3.12
  - Git
  - ESLint, Prettier, Ruff
  - Package mirror (pnpm store / Verdaccio) preloaded in the image

Network policy:
  - Generation phase (agents write files): NO network.
  - Validation phase (install/build): network restricted ONLY to the
    package registry — ideally offline install against the mirror preloaded in the image.
  - Generated code is never run with open internet access.

Lifecycle:
  1. docker run --rm --network none -v /tmp/run-{id}:/workspace orchflow/sandbox
  2. Agents write files to /workspace (no network)
  3. To validate, QA runs install against the local mirror
     (or an egress-only network to the registry is enabled): npm install
  4. QA runs build and lint (no network): npm run build, npm run lint
  5. If QA passes: zip /workspace → delivered to the user
  6. Container destroyed automatically (--rm)
```

Why the sandbox is central:
- Isolation: a generated project cannot affect the host system
- Real validation: the QA Agent can execute the code and see if it compiles
- Reproducibility: same environment every time
- Security: LLM-generated code does not run with host privileges

---

## 12. REVIEW SYSTEM

The review cycle is what differentiates OrchFlow from a simple generator:

```
Developer generates output
        │
        ▼
Tech Lead reviews:
  ✓ Does it fulfill the blueprint?
  ✓ Is the code internally coherent?
  ✓ Are critical files missing?
        │
   ┌────┴────┐
APPROVES  REJECTS (with specific feedback)
   │            │
   ▼            ▼
Continues   Developer re-generates (max. 2 attempts)
                │
                ▼ (if it fails twice)
           Chief Architect notified
           → simplifies the scope of that module
           → the run ends with status: 'partial' and the qaReport explicitly
             lists what was degraded (visible to the user in UI/CLI).
             A reduced scope is never delivered silently.
```

The QA Agent performs cross-review at the end:

```
QA verifies:
  ✓ package.json has the scripts used by the Dockerfile
  ✓ Code imports exist in the dependencies
  ✓ Environment variables in the code are in .env.example
  ✓ Backend endpoints match frontend calls
  ✓ npm run build does not fail in the sandbox
```

---

## 13. CLI + DESKTOP APP — INTERFACE AND PARITY

CLI and GUI are **two thin clients over `packages/core/src/actions/`**. Each
CLI command has its exact equivalent in the GUI and vice versa — parity is
by construction, not a list that must be kept manually in sync.

| `core` Action    | CLI Command                     | In the GUI                      |
|------------------|---------------------------------|---------------------------------|
| `new`            | `orchflow new "..."`            | Input screen → "Generate"       |
| `plan`           | `orchflow plan "..."`           | Input screen → "Plan first"     |
| `history`        | `orchflow history`              | History screen                  |
| `show`           | `orchflow show <runId>`         | Run detail                      |
| `metrics`        | `orchflow metrics --agent ...`  | Metrics screen                  |
| `evalCompare`    | `orchflow eval compare ...`     | Metrics screen → compare        |

```bash
# Create a new project
orchflow new "REST API for task management with JWT auth and PostgreSQL"

# With options
orchflow new "..." --level mvp --output ./my-project --stack fastapi

# See the plan before executing (without spending generation tokens)
orchflow plan "..."

# List previous runs / view detail
orchflow history
orchflow show <runId>

# Metrics and agent version comparison
orchflow metrics --agent backend-dev
orchflow eval compare --agent backend-dev --baseline v1 --candidate v2

# Open the desktop app (if installed)
orchflow ui
```

The desktop app (Tauri) is the same functionality with a visual interface, for
those who do not use the terminal. Packaging and installer details in §15.

---

## 14. GUI — SCREENS

> These screens are the desktop app (Tauri). In server mode, the same
> views are served over the web. Data arrives via IPC (embedded) or SSE (server).

### Screen 1: Input
- Textarea for the brief
- Output level selector with description of each level
- Time and cost estimate: heuristic per level when selected, recalculated with
  precision when "Plan first" is pressed (LLM is not called on every keystroke)
- "Plan first" button (shows the blueprint without executing) and "Generate"

### Screen 2: Live Execution
- Agent timeline with status (pending / running / reviewing / done / failed)
- Real-time log (IPC in embedded, SSE in server) — terminal style
- Preview of generated files appearing in real time
- Live metrics: tokens used, cost, elapsed time

### Screen 3: Result
- File tree of the generated project
- File preview with syntax highlighting
- QA report (passed / failed checks, scores)
- Download ZIP button
- "Open in VS Code" button

### Screen 4: History
- List of previous runs with key metrics
- Comparison of two runs (diff of generated files)

### Screen 5: System Metrics
- Build success rate by agent and version (line chart)
- Quality scores by dimension
- Cost per run over time
- Review rejection rate by agent

---

## 15. DISTRIBUTION AND INSTALLERS

OrchFlow is distributed through two channels, both on the same `core`:

**CLI** — via npm
```bash
npm install -g orchflow      # global
npx orchflow new "..."       # without installing
```

**Desktop app** — native installers with Tauri (minimal footprint):

| OS      | Format                 | Approx. size  |
|---------|------------------------|---------------|
| macOS   | `.dmg` (universal)     | ~6–10 MB      |
| Windows | `.msi` / `.exe` (NSIS) | ~6–10 MB      |
| Linux   | `.AppImage` + `.deb`   | ~6–10 MB      |

Why Tauri and not Electron:
- Installers ~10× smaller (system webview vs embedded Chromium)
- Less RAM at runtime
- Aligned with the principle of optimizing space and footprint (§16)

Cost: the `core` (Node/TS) runs as a **sidecar** launched by the Rust shell;
shell↔sidecar communication is via IPC. It is a one-time plumbing task.

**Release builds:** GitHub Actions with a matrix (macos / windows / ubuntu) generates
the three installers + the npm package on each tag. Signed binaries where applicable.

---

## 16. TOKEN ECONOMY

Guiding principle of the project: **minimize token and space consumption without
sacrificing industry standards or the deploy-ready goal.** Concrete rules:

| Rule | Where it applies |
|------|-----------------|
| Restrictive context passing: each agent receives only its defined input | §9 |
| Manifest instead of full content for Tech Writer / QA / Assembler | §9 |
| **Anthropic prompt caching**: each agent's system prompt is stable and cached between calls and runs | core/agents |
| Fewer agents = fewer tokens: the Tech Lead layer is only added if it justifies its cost | §2 |
| Run only the requested output level — never generate extra work | §1 |
| Checkpointing: a retry does not re-execute already-successful agents | §3.3 |
| Sandbox/Docker only when the level requires it | §11 |
| Deterministic scoring (build/parser) instead of LLM judge where possible | §6 |

**Measurement:** `input_tokens` and `output_tokens` are already recorded per agent in
`agent_metrics` (§8). The `cost per run` target (§8) is the indicator that monitors
whether these rules are working; if it rises, some rule is being violated.

> Prompt caching is the highest-impact lever: agent system prompts are long and stable,
> so caching them drastically cuts input costs on repeated runs. It is the first thing
> to implement when integrating the Claude API.

---

## 17. IMPLEMENTATION PHASES

### Phase 0 — Foundations (week 1)
**Goal**: Working monorepo, defined types, first real agent

- [ ] Set up monorepo with pnpm workspaces + TypeScript
- [ ] `packages/core/src/types/`: all data contracts
- [ ] `packages/core/src/agents/chief-architect/`: evaluation → blueprint
- [ ] `packages/core/src/agents/backend-dev/`: blueprint → real files
- [ ] Level 1 and 2 tests for both agents
- [ ] Integration test: brief → files on disk
- [ ] Base Dockerfiles

**Gate**: `pnpm test` passes AND real files exist in `/tmp/orchflow-test/`

### Phase 1 — Full Team (weeks 2–3)
**Goal**: Pipeline without Tech Leads (Architect → Devs → QA → Writer), no reviews

- [ ] Frontend Developer agent
- [ ] DevOps (CI/CD + Infra) agent
- [ ] Tech Writer agent
- [ ] Assembler: consolidates files without conflicts
- [ ] Functional ZIP output
- [ ] Basic metrics system (latency, tokens, cost)
- [ ] Prompt caching of system prompts (§16) from the first agent

Tech Leads are NOT implemented yet (see design note §2): they are added in a
later iteration only if metrics justify their cost in tokens/latency.

**Gate**: Generated ZIP runs `npm install && npm run build` without errors

### Phase 2 — Reviews and QA (week 4)
**Goal**: Working cross-review system

- [ ] QA Reviewer agent
- [ ] Review cycle Developer → QA → rework (max. 2 attempts)
- [ ] Docker sandbox for real validation (mvp/deliverable levels, §11)
- [ ] QA runs build/lint in the sandbox
- [ ] Chief Architect handles rejections (degradation to `partial` visible to user)
- [ ] Scoring: deterministic (build/parser) + LLM-as-a-Judge only for `quality`
- [ ] Quality metrics saved in SQLite
- [ ] (optional) Tech Lead layer, if its impact is to be measured

**Gate**: QA detects and reports inconsistencies in a project with planted errors

### Phase 3 — CLI + Desktop App (weeks 5–6)
**Goal**: Both interfaces over `core/actions`, in embedded mode

- [ ] `packages/core/src/actions/`: internal API (new, plan, history, show, metrics, evalCompare)
- [ ] `packages/cli` (oclif): thin client over actions
- [ ] `packages/ui` (React): screen components (§14)
- [ ] `apps/desktop` (Tauri): shell + webview + `core` as sidecar; streaming via IPC
- [ ] Docker detection + guidance when the level requires it (§11)
- [ ] System metrics screen
- [ ] (optional) `packages/server`: server mode with Fastify + Bull + Redis + SSE

**Gate (parity)**: the same run can be triggered via CLI and via the app, produces the
same output, and `npx orchflow new "..."` generates a valid ZIP without starting Redis.

### Phase 4 — Output Levels (week 7)
**Goal**: All 4 levels working correctly

- [ ] `blueprint`: architecture and docs only
- [ ] `scaffold`: base code
- [ ] `mvp`: auth + DB + tests
- [ ] `deliverable`: everything + validations + error handling
- [ ] Test suite per level

**Gate**: All 4 levels produce distinct outputs verified by `pnpm test:levels`

### Phase 5 — Evolution and Open Source (week 8)
**Goal**: Working continuous improvement system + ready to publish

- [ ] Benchmark set of 10 reference briefs
- [ ] Working `eval:regression` command
- [ ] A/B experiments between prompt versions
- [ ] Excellent README (generated with OrchFlow)
- [ ] Documentation for adding a new agent
- [ ] `npm install -g orchflow` works
- [ ] Tauri installers (.dmg / .msi / .AppImage+.deb) via GitHub Actions matrix (§15)

**Gate**: The evolution system automatically rejects a worse prompt and promotes
a better one over the benchmark set, with a statistical criterion (Gate 5 → release, §5).

---

## 18. STRUCTURE FOR CONTINUOUS CONTRIBUTION

### Commit Convention

```
feat(agents): add qa reviewer v1
fix(orchestrator): handle agent timeout gracefully
test(backend-dev): add contract tests for Node.js projects
prompt(backend-dev): v2 with improved file structure output
eval(backend-dev): v2 scores 12% higher than v1 on build success
refactor(core): extract context builder to separate module
docs(adr): add ADR-005 for rate limiting strategy
```

The `prompt` and `eval` categories are OrchFlow-specific.
They make the agent evolution history readable at a glance.

### Mandatory ADRs

Write an ADR when:
- The change affects more than one package in the monorepo
- An interface defined in AGENTS.md is changed
- A new technology is added to the stack
- A decision is made that could be questioned in 3 months

An ADR is not needed for:
- Internal changes to a package
- Prompt improvements (they go in the agent's CHANGELOG)
- Bug fixes

### Agent CHANGELOG

```
packages/core/src/agents/backend-dev/
  CHANGELOG.md    ← version history with scores
  v1.prompt.ts
  v2.prompt.ts
  active.ts       ← points to the active version
```

### To Resume the Project After a Break

1. Read this document (MASTER_PLAN.md)
2. Check which phase the project is in: `git log --oneline -20`
3. Review the CHANGELOG of each agent to see where evolution left off
4. Run `pnpm test` to confirm the current state
5. Continue from the gate of the current phase

---

## 19. KEY TECHNICAL DECISIONS

| Decision | Choice | Reason |
|----------|--------|--------|
| LLM provider | Anthropic Claude | Best instruction following for structured JSON |
| Distribution | CLI (npm) + desktop app | "Download & run" for devs and non-devs, with parity |
| GUI shell | Tauri | Small installers, minimal footprint (vs Electron) |
| Default deployment | Embedded (no Redis) | "Download & run" without starting a server |
| Job queue | In-memory (embedded) / Bull+Redis (server) | Redis only when there is real concurrency |
| Main DB | SQLite (Drizzle) | Zero config, sufficient for v1, easy to migrate to PG |
| Streaming | IPC (embedded) / SSE (server) | Simplest option per mode |
| CLI | oclif | Production-grade, auto-help, testable |
| Monorepo | pnpm workspaces | Shared types between packages without duplication |
| CLI↔GUI parity | Both over `core/actions` | Single logic, parity by construction |
| Agent communication | Orchestrator (not peer-to-peer) | Debuggable, testable, observable |
| Agent selection | Dynamic (LLM evaluator) | Intelligent vs hardcoded rules |
| LLM cost | Prompt caching from day 1 | Stable system prompts → large savings (§16) |

---

## 20. WHAT ORCHFLOW DOES NOT DO (EXPLICIT SCOPE)

- **Does not deploy the generated project** — delivers the ZIP, deployment is yours
- **Does not use memory between projects** in v1 — each run is independent. History
  IS recorded in SQLite, but the Chief Architect will only *consume* it
  for decisions (accumulated learning) in v2 (see §9).
- **Does not generate tests with 100% coverage** — generates structure and key cases
- **Does not support all stacks** in v1 — Node.js/TypeScript and Python/FastAPI
- **Is not an IDE** — generates files, does not edit them interactively
- **Does not have multi-tenancy** in v1 — single-user, self-hosted
- **Does not trust the brief as safe input** — the brief is free text and code is
  generated and executed from it. The sandboxed network mitigates *execution*,
  but does not prevent an adversarial brief from producing malicious content in the ZIP.
  For v1 (self-hosted, single-user) the risk is low and remains with the user.

---

## 21. INSTRUCTIONS FOR CLAUDE CODE

### Implementation Order — Phase 0

1. Monorepo setup (pnpm workspaces, TypeScript, ESLint, Prettier)
2. `packages/core/src/types/index.ts` — all contracts from this document
3. `packages/core/src/agents/chief-architect/` — with level 1 and 2 tests
4. `packages/core/src/agents/backend-dev/` — with level 1 and 2 tests
5. `packages/core/src/__tests__/integration.test.ts` — brief → files on disk
6. Base Dockerfiles

### Implementation Principles

- Each agent is a class that implements the `Agent` interface
- Each agent's prompts live in separate `.prompt.ts` files, apart from the code
- Everything is typed — do not use `any`
- Tests are the executable documentation for each agent
- Errors are explicit — do not silence exceptions
- Each agent records its metrics (latency, tokens, cost) on every call
- Prompts have an explicit version number from the first commit

### Do Not Do in Phase 0

- Do not implement CLI or GUI
- Do not implement all agents — only chief-architect and backend-dev
- Do not implement the Docker sandbox yet
- Do not implement advanced metrics — only basic recording

The Phase 0 success criterion is simple and verifiable:
`pnpm test` passes AND `/tmp/orchflow-test/package.json` exists with real content.
