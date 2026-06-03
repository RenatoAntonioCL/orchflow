# OrchFlow — Master Plan Completo
# Versión 2.1 — Documento definitivo para implementación

> Este documento define exactamente qué es OrchFlow, cómo está estructurado,
> sus gates de calidad, estrategia de evolución, testing, métricas, memoria,
> infraestructura y estructura de contribución.
> Destinado a: Claude Code / implementación técnica y referencia continua del proyecto.

---

## ÍNDICE

1. Visión del producto
2. Jerarquía de agentes
3. Arquitectura del sistema
4. Contratos de datos
5. Gates de calidad entre fases
6. Evolución de agentes — mejora continua
7. Estrategia de testing
8. Métricas de funcionamiento
9. Modelo de memoria y contexto
10. Infraestructura — modos de despliegue y qué va en qué versión
11. Sandbox — validación atada al nivel de output
12. Sistema de revisión
13. CLI + App de escritorio — interfaz y paridad
14. GUI — pantallas
15. Distribución e instaladores
16. Economía de tokens
17. Fases de implementación
18. Estructura para contribución continua
19. Decisiones técnicas clave
20. Lo que OrchFlow no hace (scope explícito)
21. Instrucciones para Claude Code

---

## 1. VISIÓN DEL PRODUCTO

OrchFlow es una **agencia de desarrollo de software autónoma** impulsada por LLMs.

Dado un requerimiento en lenguaje natural, OrchFlow coordina un equipo de agentes
especializados con jerarquía, revisiones cruzadas y roles definidos para entregar
un proyecto de software real — funcional, documentado y listo para continuar.

**No es**: un generador de scaffolding, un chatbot, ni un wrapper de LangChain.

**Es**: un sistema donde cada agente tiene un rol, responsabilidades, criterios de
aceptación, y puede rechazar o pedir revisión del trabajo de otros agentes.

### Output configurable por el usuario

El usuario elige el nivel de completitud antes de ejecutar:

| Nivel | Nombre       | Descripción                                                        | Tiempo est. |
|-------|--------------|--------------------------------------------------------------------|-------------|
| 1     | `blueprint`  | Arquitectura, ADRs, estructura de carpetas, contratos de API       | < 1 min     |
| 2     | `scaffold`   | Nivel 1 + código base funcional, configs, CI/CD, Dockerfile        | 2–4 min     |
| 3     | `mvp`        | Nivel 2 + auth, DB con migraciones, tests, README completo         | 5–10 min    |
| 4     | `deliverable`| Nivel 3 + validaciones, error handling, logging, deploy-ready      | 10–20 min   |

---

## 2. JERARQUÍA DE AGENTES

```
┌─────────────────────────────────────────┐
│           CHIEF ARCHITECT               │  ← Recibe el brief, define la visión
│     (Orchestrator / Evaluador)          │     técnica, asigna trabajo
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
│    QA / Reviewer   │  ← Revisa outputs de todos los devs
└────────────────────┘
          │
          ▼
┌────────────────────┐
│    TECH WRITER     │  ← Documenta el proyecto completo al final
└────────────────────┘
```

### Roles y responsabilidades

**Chief Architect (Orchestrator)**
- Recibe el brief del usuario
- Produce `ProjectBlueprint` (visión técnica, stack, nivel de output)
- Asigna tareas a Tech Leads con contexto específico
- Recibe los outputs finales y hace el ensamblado
- Puede rechazar un output y re-asignar con feedback

**Tech Lead (Backend / Frontend / DevOps)**
- Recibe el blueprint del Chief Architect
- Define la arquitectura específica de su área
- Delega implementación al Developer de su área
- Revisa el output del Developer antes de pasarlo al QA
- Puede pedir re-trabajo al Developer (máx. 2 iteraciones)

**Developer (Backend / Frontend)**
- Recibe especificaciones del Tech Lead
- Genera el código real (archivos concretos)
- Entrega output al Tech Lead para revisión

**CI/CD + Infra Agent**
- Trabaja en paralelo con Backend Dev
- Genera Dockerfile, docker-compose, workflows de GitHub Actions
- Se sincroniza con el output del Backend para usar los mismos comandos

**QA / Reviewer Agent**
- Recibe todos los outputs de los Developers
- Verifica consistencia cruzada
- Verifica que el proyecto compila (ejecuta comandos reales en el sandbox)
- Genera reporte de issues — los issues críticos bloquean la entrega

**Tech Writer**
- Recibe el proyecto completo
- Genera README.md, CONTRIBUTING.md, documentación de API
- Es el último agente en ejecutar

### Lista canónica de agentes (única fuente de verdad)

Estos son los únicos agentes que existen en v1. Cualquier otra mención en este
documento (ej: "Core Dev", "Security Agent", "testing agent") es un alias o
trabajo futuro y debe normalizarse a esta tabla:

| AgentId            | Rol             | Alias / notas                          |
|--------------------|-----------------|----------------------------------------|
| `chief-architect`  | Orchestrator    | —                                      |
| `backend-tl`       | Tech Lead       | —                                      |
| `frontend-tl`      | Tech Lead       | —                                      |
| `devops`           | DevOps          | "CI/CD + Infra agent"                  |
| `backend-dev`      | Developer       | NUNCA "Core Dev" — usar `backend-dev`  |
| `frontend-dev`     | Developer       | —                                      |
| `qa`               | QA / Reviewer   | absorbe checks de testing y seguridad  |
| `tech-writer`      | Tech Writer     | —                                      |

Un `security-agent` dedicado es trabajo de v2; en v1 los chequeos de seguridad
(dependencias, endpoints expuestos) los hace el agente `qa`.

> **Nota de diseño — la capa Tech Lead se mide antes de darse por sentada.**
> Cada Tech Lead que delega y luego revisa son 2+ llamadas LLM extra. Con los
> targets de `< $0.50` y `< 5 min` (§8), esa capa puede no pagar su costo.
> Fase 1 se implementa primero SIN Tech Leads (Architect → Dev → QA); los Tech
> Leads se incorporan solo si las métricas muestran que mejoran `coherence` más
> de lo que cuestan en latencia y tokens. Mismo principio que la infra (§10):
> un componente entra cuando resuelve un problema que ya existe, no uno hipotético.

---

## 3. ARQUITECTURA DEL SISTEMA

### 3.1 Stack tecnológico de OrchFlow

**Core (engine compartido por CLI y GUI)**
- Runtime: Node.js 20 + TypeScript 5
- LLM: Anthropic Claude API — id de modelo pineado con fecha (ej: `claude-sonnet-4-6`), nunca alias móvil (ver §6, model pinning); prompt caching de system prompts (§16)
- Queue: en memoria en modo embedded; Bull + Redis solo en modo server
- Storage: SQLite vía Drizzle ORM (runs, métricas, historial de agentes)
- Sandbox: dockerode (Docker SDK para Node.js), atado al nivel de output (§11)
- API HTTP (Fastify): solo en modo server (opcional, §10)

**GUI / App de escritorio (Tauri)**
- Shell: Tauri (Rust) — instaladores chicos (~5–10 MB), usa el webview del sistema
- UI: React 19 + TypeScript + Tailwind + Zustand
- Engine: `core` (Node/TS) corre como **sidecar** lanzado por Tauri
- Realtime: eventos del sidecar → UI (IPC); SSE solo en modo servidor
- Elegido por footprint mínimo (ver §16, economía de tokens y espacio)

**CLI**
- Framework: oclif (CLI framework production-grade)
- Cliente fino sobre `core` — misma lógica que la GUI (paridad por construcción)

**Modos de despliegue**
- **Embedded** (default): engine in-process, sin Redis ni servidor. Es lo que usan
  CLI y GUI. "Download & run" sin levantar nada (salvo Docker si el nivel lo pide).
- **Server** (opcional/avanzado): API Fastify + Bull + Redis + SSE, para uso
  repetido o multi-job. No es requisito para usar OrchFlow.
- Docker se usa para el sandbox de validación, atado al nivel de output (ver §11).

### 3.2 Estructura de monorepo

```
orchflow/
├── packages/
│   ├── core/                    # Lógica central compartida
│   │   ├── src/
│   │   │   ├── orchestrator/    # Chief Architect + coordinación
│   │   │   ├── agents/          # Todos los agentes
│   │   │   │   └── backend-dev/
│   │   │   │       ├── v1.prompt.ts
│   │   │   │       ├── v2.prompt.ts
│   │   │   │       ├── active.ts
│   │   │   │       └── CHANGELOG.md
│   │   │   ├── evaluator/       # Análisis del brief
│   │   │   ├── sandbox/         # Docker sandbox manager
│   │   │   ├── assembler/       # Ensamblado del output final
│   │   │   ├── metrics/         # Recolección y persistencia de métricas
│   │   │   └── types/           # Interfaces y tipos compartidos
│   │   └── package.json
│   │   └── actions/         # API interna que consumen CLI y GUI (paridad)
│   ├── cli/                     # CLI con oclif — cliente fino sobre core
│   ├── ui/                      # Componentes React compartidos por la GUI
│   └── server/                  # OPCIONAL: API Fastify + Bull + Redis (modo server)
├── apps/
│   └── desktop/                 # App Tauri (shell Rust + webview React + core sidecar)
├── docker/
│   ├── Dockerfile.sandbox       # imagen de validación (con mirror de paquetes)
│   ├── Dockerfile.server        # solo para modo server
│   └── docker-compose.yml       # solo para modo server
├── docs/
├── pnpm-workspace.yaml
└── package.json
```

`packages/core/src/actions/` es la **única superficie** que invocan tanto el CLI
como la GUI (`new`, `plan`, `history`, `metrics`, `evalCompare`). Una acción nueva
se agrega aquí una vez y queda disponible en ambos. Si una acción existe solo en un
adapter, es un bug de paridad.

### 3.3 Flujo de una ejecución

```
1. Input (CLI o GUI)
   └── brief: string
   └── outputLevel: 'blueprint' | 'scaffold' | 'mvp' | 'deliverable'

2. API recibe el job → encola en Bull → responde con jobId

3. Worker toma el job:
   a. Chief Architect evalúa el brief → ProjectBlueprint
   b. Chief Architect abre sandbox Docker para el run
   c. Ejecuta agentes en orden (con paralelismo donde aplica):
      ├── [paralelo] Backend TL + Frontend TL + DevOps Agent
      ├── [paralelo] Backend Dev + Frontend Dev
      │     - Frontend Dev trabaja contra el CONTRATO DE API del Backend TL
      │       (endpoints y tipos), NO contra el output del Backend Dev. Por eso
      │       pueden correr en paralelo. Si el contrato del TL y lo que produce
      │       el Dev divergen, lo concilia el QA.
      ├── QA Reviewer (después de todos los devs)
      └── Tech Writer (último)
   d. Assembler consolida todos los archivos en el sandbox
   e. QA ejecuta validaciones reales (npm install, build, lint)
   f. Output final: ZIP del proyecto

   Checkpointing: el estado del run (outputs de cada agente completado) se
   persiste en SQLite a medida que avanza. Si el job falla y Bull lo reintenta,
   se reanuda desde el último agente completado — NO se re-ejecutan agentes ya
   exitosos. Sin esto, cada retry duplicaría el costo de tokens del run entero.

4. Metadata del run guardada en SQLite

5. Métricas registradas (build success, scores, latencia, costo)
```

---

## 4. CONTRATOS DE DATOS

### Tipos base

```typescript
type AgentId =
  | 'chief-architect' | 'backend-tl' | 'frontend-tl' | 'devops'
  | 'backend-dev' | 'frontend-dev' | 'qa' | 'tech-writer';

type AgentRole =
  | 'orchestrator' | 'tech-lead' | 'developer' | 'devops' | 'qa' | 'tech-writer';

type OutputLevel = 'blueprint' | 'scaffold' | 'mvp' | 'deliverable';
```

Todos los contratos llevan `_version` para permitir migraciones futuras.

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
  promptVersion: string;       // ej: 'v2' — para correlacionar con métricas
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
    // Vocabulario unificado de scores (ver §6 y §8).
    // correctness, completeness y coherence son DETERMINISTAS (build/parser);
    // quality es la única dimensión evaluada por LLM-as-a-Judge.
    scores: {
      correctness: number;    // 0–1  determinista: el build/tsc pasa
      coherence: number;      // 0–1  determinista: refs cruzadas válidas (= "consistency" de §8)
      completeness: number;   // 0–1  determinista: archivos presentes / esperados
      quality: number;        // 0–1  LLM-as-a-Judge: buenas prácticas del stack
    };
  };

  outputZipPath: string;
}
```

---

## 5. GATES DE CALIDAD ENTRE FASES

Un gate es una **pregunta binaria con evidencia ejecutable**.
Si no puedes responder "sí" con un comando o una prueba, no pasa.

### Gate 0 → 1
**Pregunta**: ¿`pnpm test` pasa Y hay archivos reales generados en `/tmp/orchflow-test/`?

```bash
# Evidencia requerida:
pnpm test                          # todos los tests en verde
ls /tmp/orchflow-test/package.json # archivo real existe
```

No vale: "el código se ve bien" / "creo que funciona".

### Gate 1 → 2
**Pregunta**: ¿El ZIP generado hace `npm install && npm run dev` sin errores en un entorno limpio?

```bash
# Evidencia requerida:
unzip output.zip -d /tmp/test-project
cd /tmp/test-project
npm install   # exit code 0
npm run build # exit code 0
```

No vale: que los archivos existan pero no corran.

### Gate 2 → 3
**Pregunta**: ¿El QA Agent detecta al menos 1 inconsistencia real en un proyecto con errores plantados deliberadamente?

```bash
# Evidencia requerida:
pnpm test:qa --fixture broken-project
# El reporte debe listar el error plantado como issue crítico
```

No vale: que el QA corra sin errores pero no detecte nada.

### Gate 3 → 4
**Pregunta**: ¿El mismo proyecto se puede generar por CLI y por la app de escritorio,
con idéntico output, sin levantar Redis?

```bash
# Evidencia requerida (modo embedded):
npx orchflow new "..." --level scaffold -o /tmp/cli-run   # ZIP válido, sin Redis
# y el MISMO brief desde la app de escritorio → genera el mismo proyecto
# Flujo completo en ambos: brief → generación → ZIP válido
```

No vale: que la UI exista pero el flujo completo falle, o que CLI y GUI difieran.

### Gate 4 → 5
**Pregunta**: ¿Los 4 niveles producen outputs distintos y coherentes con su definición?

```bash
# Evidencia requerida:
# blueprint: solo docs/arquitectura, sin código
# scaffold: código base que compila
# mvp: incluye auth y DB
# deliverable: incluye tests y error handling
pnpm test:levels # suite específica que verifica cada nivel
```

No vale: que todos los niveles generen lo mismo con distinto nombre.

### Gate 5 → release
**Pregunta**: ¿El sistema de evolución rechaza automáticamente un prompt peor
y promueve uno mejor, sobre el benchmark set, con criterio estadístico?

```bash
# Evidencia requerida:
pnpm eval:regression --agent backend-dev --version vTEST --baseline active
# Plantar deliberadamente un vTEST peor → debe quedar RECHAZADO.
# Plantar un vTEST mejor (mejora > umbral y fuera del desvío) → debe PROMOVERSE.
```

No vale: que el comando corra pero promueva/rechace sin mirar la varianza.

---

## 6. EVOLUCIÓN DE AGENTES — MEJORA CONTINUA

### Capa 1 — Versionado de prompts

Cada prompt vive en un archivo versionado. Cambiar un prompt = nuevo archivo, nunca sobrescribir.

```
packages/core/src/agents/backend-dev/
  v1.prompt.ts     ← versión original
  v2.prompt.ts     ← primera iteración
  active.ts        ← re-exporta v2 como default
  CHANGELOG.md     ← historial con scores por versión
```

`CHANGELOG.md` de un agente:
```markdown
## v2 (2025-07-15)
- Mejorado: instrucción de estructura de carpetas más específica
- Build success rate: 91% (+12% vs v1)
- Coherence score: 0.88 (+0.09 vs v1)

## v1 (2025-06-01)
- Versión inicial
- Build success rate: 79%
- Coherence score: 0.79
```

### Capa 2 — Scoring (determinista primero, juez LLM solo donde hace falta)

Después de cada run se puntúa el output en 4 dimensiones. **Tres de las cuatro
son deterministas** — las mide el sandbox/parser, NO un LLM. Usar un juez para
validez sintáctica sería más caro y menos confiable que correr el build.

| Dimensión    | Cómo se mide                                          | Tipo           | Target |
|--------------|-------------------------------------------------------|----------------|--------|
| Correctness  | `tsc`/`build` pasa en el sandbox                      | DETERMINISTA   | > 0.95 |
| Completeness | archivos presentes / archivos esperados              | DETERMINISTA   | > 0.85 |
| Coherence    | refs cruzadas válidas (imports, endpoints, env vars) | DETERMINISTA   | > 0.88 |
| Quality      | sigue buenas prácticas del stack elegido             | LLM-as-a-Judge | > 0.80 |

Solo `Quality` requiere el agente juez LLM. Los chequeos deterministas reutilizan
exactamente la lógica del QA Agent (§12) — una sola implementación, dos consumidores.

Los scores se guardan en SQLite asociados a `(agentId, promptVersion, projectType)`
y son la **única fuente de verdad**. El bloque de scores del `CHANGELOG.md` de cada
agente se GENERA desde SQLite (no se escribe a mano) para que no diverjan.

### Capa 3 — Experimentos A/B

Cuando hay dos versiones de un prompt:
1. Correr ambas sobre el benchmark set, con **k=3 corridas por brief** (seeds fijas)
   para medir varianza, no una sola muestra.
2. Comparar **media ± desvío estándar** por dimensión, no solo el promedio.
3. La nueva versión se vuelve `active` solo si su mejora supera el 5% **y** el
   intervalo no se solapa con el de la baseline (la mejora está fuera del ruido).
4. Validar contra el **held-out set** antes de promover: si mejora en el benchmark
   pero no en el held-out, es overfitting → se descarta.
5. Si no pasa: se documenta en el CHANGELOG y se descarta.

**Model pinning:** el id del modelo se fija con fecha (ej: `claude-sonnet-4-6`),
nunca un alias móvil. Si el modelo cambia, los scores históricos dejan de ser
comparables y hay que re-baselinear — el benchmark inmutable solo tiene sentido
con modelo fijo.

El benchmark set es `packages/core/src/benchmarks/briefs.ts` con 10 briefs
representativos. Es inmutable — siempre los mismos para comparar de forma justa.
Además hay un **held-out set** (`briefs.holdout.ts`, otros 5 briefs) que NUNCA se
usa para decidir `active`, solo para detectar overfitting a los 10 del benchmark.

---

## 7. ESTRATEGIA DE TESTING

### Nivel 1 — Tests de estructura (rápidos, sin API)

Verifican que el output tiene la forma correcta independientemente del contenido.
Sin llamadas LLM — usan outputs mockeados.

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

### Nivel 2 — Tests de contrato (rápidos, sin API)

Verifican invariantes de negocio: ciertos archivos siempre deben existir
para ciertos tipos de proyecto.

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

### Nivel 3 — Tests de compilación (sandbox, bajo demanda)

El código generado realmente compila. Lo ejecuta el QA Agent en el sandbox Docker.

```bash
# Dentro del sandbox:
npm install --silent && npm run build
# Exit code 0 = test pasa
# Exit code != 0 = issue crítico registrado
```

Corren: al ejecutar un run real, y en el Gate 1→2.

### Nivel 4 — Tests de regresión de calidad (con API, en releases)

Después de cada cambio de prompt, correr el benchmark set completo y comparar
scores con la versión anterior. Si el score promedio baja más de 5%, el cambio
no entra.

```bash
pnpm eval:regression --agent backend-dev --version v3 --baseline v2
# Output: tabla comparativa de scores por dimensión y tipo de proyecto
```

### Distribución de tests en CI

```
Cada commit   → Nivel 1 + Nivel 2 (segundos, gratis)
Cada PR       → Nivel 1 + Nivel 2 + Nivel 3 en 2 fixtures
              + smoke-eval (Nivel 4 reducido: 1–2 briefs) si el PR toca un .prompt.ts
Cada release  → Todos los niveles + regresión completa
```

El smoke-eval en PR existe porque los tests Nivel 1/2 usan outputs mockeados:
testean el harness, no la calidad del agente. Sin él, una regresión de calidad
por un cambio de prompt pasa desapercibida hasta el release. Solo corre cuando el
diff toca un archivo `.prompt.ts`, para no gastar tokens de gusto.

---

## 8. MÉTRICAS DE FUNCIONAMIENTO

### Métricas de producto

| Métrica               | Definición                                          | Target v1 | Target v2 |
|-----------------------|-----------------------------------------------------|-----------|-----------|
| Build success rate    | % de proyectos que compilan sin errores             | 80%       | 92%       |
| File completeness     | archivos presentes / archivos esperados             | > 0.85    | > 0.93    |
| Consistency score     | referencias cruzadas válidas entre archivos         | > 0.88    | > 0.95    |
| Time to usable        | minutos desde brief hasta proyecto que corre        | < 5 min   | < 3 min   |

### Métricas de sistema

| Métrica               | Definición                                          | Target    |
|-----------------------|-----------------------------------------------------|-----------|
| Cost per run          | USD por run en nivel scaffold                       | < $0.50   |
| Agent success rate    | % agentes que completan sin retry                   | > 95%     |
| Review rejection rate | % outputs rechazados por Tech Lead                  | (monitor) |
| p95 latency/agente    | percentil 95 de tiempo por agente                   | < 15s     |

`review_rejection_rate` no tiene target — es un indicador diagnóstico.
Si un agente tiene > 30% de rechazos, el prompt necesita revisión urgente.

### Almacenamiento de métricas

Todas las métricas van a SQLite en la tabla `agent_metrics`. El esquema se define
con Drizzle (la SQL de abajo es la forma resultante, como referencia):

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
  build_success INTEGER,  -- 0 o 1
  rejected    INTEGER,    -- 0 o 1
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Índice para el patrón de consulta principal (evolución por agente/versión/tipo):
CREATE INDEX idx_agent_metrics_lookup
  ON agent_metrics (agent_id, prompt_ver, project_type);
```

La GUI tiene una pantalla de métricas que muestra evolución por agente y versión.

---

## 9. MODELO DE MEMORIA Y CONTEXTO

### Tres tipos de información

**Contexto de run** — en memoria durante la ejecución, se descarta al terminar

El `ExecutionContext` que pasa el Orchestrator a cada agente. Incluye el blueprint
completo y los outputs de agentes anteriores según el grafo de dependencias.

**Contexto de proyecto** — persiste en SQLite

El *registro* de runs anteriores se guarda en SQLite desde v1 (es barato). El
*consumo* de ese historial por el Chief Architect — ej: "¿qué stack tuvo mejor
build success rate para proyectos `api` en los últimos 30 runs?" — es aprendizaje
acumulado sin fine-tuning, y es **trabajo de v2** (ver §20). En v1 cada run es
independiente; solo se acumula la data para habilitarlo después.

**Contexto de agente** — historial de versiones con scores

El sistema sabe qué versión de cada agente tiene mejor rendimiento y la usa.
Está en SQLite + los archivos `active.ts` de cada agente.

### Reglas de paso de contexto

El paso de contexto entre agentes es deliberadamente restrictivo.
Contexto innecesario = prompts más costosos y outputs menos focalizados.

```
Chief Architect  → todos:            blueprint completo
Backend TL       → Frontend Dev:     contrato de API (endpoints y tipos)
Backend Dev      → DevOps:           comandos de build y test
Backend Dev      → QA:               estructura de archivos esperada
                                     (QA también revisa dependencias y endpoints
                                      expuestos — no hay agente de seguridad en v1)
Todos            → Tech Writer:      outputs completos
```

Si un agente necesita información que no está en su input definido,
el diseño está mal — hay que ajustar el grafo, no agregar más contexto.

**Ventana de contexto en proyectos grandes:** Tech Writer, Assembler y QA reciben
"outputs completos", lo que en un `deliverable` grande puede exceder el context
window. Estrategia: estos agentes reciben un MANIFIESTO (árbol de archivos +
firmas/exports + decisiones), no el contenido literal de cada archivo, y piden el
contenido de un archivo puntual solo cuando lo necesitan. El proyecto entero nunca
se mete completo en un solo prompt.

### Grafo de dependencias

```
chief-architect ─► backend-tl  ─► backend-dev ──┐
                ├─► frontend-tl ─► frontend-dev ─┤
                └─► devops                       │
                                                 ▼
                                                qa ─► tech-writer
```

frontend-dev depende del CONTRATO de backend-tl (no de backend-dev), por eso
backend-dev y frontend-dev corren en paralelo (ver §3.3). qa recibe los outputs
de todos los devs + devops; tech-writer es el último y recibe todo.

---

## 10. INFRAESTRUCTURA — MODOS DE DESPLIEGUE Y QUÉ VA EN QUÉ VERSIÓN

La regla: **una tecnología entra cuando resuelve un problema que ya existe,
no un problema que podría existir.**

### Dos modos de despliegue

OrchFlow corre en dos modos sobre el mismo `core`. La distribución principal
(CLI + GUI) usa **embedded**; el modo **server** es opcional para uso avanzado.

| Aspecto        | Embedded (default)                  | Server (opcional)                    |
|----------------|-------------------------------------|--------------------------------------|
| Cómo arranca   | CLI / app de escritorio             | `docker compose up` o `orchflow serve` |
| Engine         | in-process (en el proceso/sidecar)  | API Fastify + worker                 |
| Cola de jobs   | en memoria (1 run a la vez por defecto) | Bull + Redis                     |
| Streaming      | eventos IPC → UI                    | SSE                                  |
| Dependencias   | Docker solo si el nivel lo pide (§11) | Docker + Redis                     |
| Para qué       | "download & run", uso personal      | uso repetido, multi-job, futura nube |

Consecuencia clave: **Redis deja de ser requisito de v1.** Un usuario que instala
la app o el CLI no necesita levantar nada para generar un proyecto.

### v1 — Lo que se construye ahora

| Tecnología     | Por qué en v1                                        |
|----------------|------------------------------------------------------|
| Docker         | Sandbox de validación — solo cuando el nivel lo pide (§11) |
| Cola en memoria| Suficiente para el modo embedded single-user        |
| SQLite         | Persistencia de runs y métricas — zero config        |
| Tauri          | App de escritorio cross-platform con footprint mínimo (§15) |
| oclif          | CLI cliente fino sobre core                          |
| Error logging  | Observabilidad básica — saber qué falla y por qué    |
| GitHub Actions | CI/CD del propio OrchFlow                            |
| (server opc.)  | Fastify + Bull + Redis + SSE — solo si se usa modo server |

### v2 — Cuando OrchFlow tenga usuarios reales

| Tecnología     | Trigger para incorporarla                            |
|----------------|------------------------------------------------------|
| Redis caching  | Cuando runs similares se repitan frecuentemente      |
| WebSockets     | Si SSE muestra limitaciones en producción            |
| S3             | Cuando los ZIPs necesiten storage persistente        |
| PostgreSQL     | Cuando SQLite muestre contención con múltiples users |
| RabbitMQ/SQS   | Cuando haya colas de trabajo entre múltiples workers |

### v3 — Si OrchFlow se convierte en plataforma

| Tecnología     | Trigger para incorporarla                            |
|----------------|------------------------------------------------------|
| Kubernetes     | Cuando necesites escalar horizontalmente             |
| Load balancer  | Cuando haya tráfico real que distribuir              |
| Sharding       | Cuando la DB tenga millones de runs                  |
| Encryption     | Cuando haya datos de usuarios en producción          |
| CDN            | Cuando la GUI web (hosted) tenga usuarios globales   |

### Nunca en OrchFlow (con justificación)

| Tecnología  | Por qué no                                           |
|-------------|------------------------------------------------------|
| FTP         | No hay transferencia de archivos legacy              |
| DynamoDB    | SQLite → PostgreSQL es el camino natural, no NoSQL   |
| TensorFlow  | Los modelos de evaluación son LLMs externos, no ML propio |

---

## 11. SANDBOX — VALIDACIÓN ATADA AL NIVEL DE OUTPUT

El sandbox Docker no es todo-o-nada: se usa **solo cuando el nivel de output lo
justifica**. Así un usuario que quiere un `blueprint` o `scaffold` no necesita
Docker instalado, y el aislamiento real se paga solo para outputs deploy-ready.

| Nivel         | Validación                          | ¿Docker? |
|---------------|-------------------------------------|----------|
| `blueprint`   | ninguna (solo docs/arquitectura)    | No       |
| `scaffold`    | liviana: build en subproceso aislado del host | No |
| `mvp`         | real: install + build + tests       | **Sí**   |
| `deliverable` | real + artefactos deploy-ready (Dockerfile, healthcheck, env, CI pasa) | **Sí** |

La app/CLI **detecta Docker** al arrancar. Si un usuario pide `mvp`/`deliverable`
y falta Docker, lo guía a instalarlo (no falla en silencio ni degrada sin avisar).
El modo server siempre usa Docker.

> "Listo para deploy" (estándar de industria) no es solo que compile: el agente
> `devops` produce Dockerfile, healthcheck, variables de entorno y CI, y la
> validación de `deliverable` los chequea — no solo `npm run build`.

### Detalle del sandbox Docker (niveles mvp/deliverable)

```
Imagen base: orchflow/sandbox:latest
  - Node.js 20 + pnpm
  - Python 3.12
  - Git
  - ESLint, Prettier, Ruff
  - Mirror de paquetes (pnpm store / Verdaccio) precargado en la imagen

Política de red:
  - Fase de generación (los agentes escriben archivos): SIN red.
  - Fase de validación (install/build): red restringida SOLO al registry de
    paquetes — idealmente install offline contra el mirror precargado en la imagen.
  - El código generado nunca se ejecuta con red abierta hacia internet.

Lifecycle:
  1. docker run --rm --network none -v /tmp/run-{id}:/workspace orchflow/sandbox
  2. Los agentes escriben archivos en /workspace (sin red)
  3. Para validar, QA corre el install contra el mirror local
     (o se habilita una red egress-only al registry): npm install
  4. QA ejecuta build y lint (sin red): npm run build, npm run lint
  5. Si QA pasa: zip /workspace → entregado al usuario
  6. Contenedor destruido automáticamente (--rm)
```

Por qué el sandbox es central:
- Aislamiento: un proyecto generado no puede afectar el sistema host
- Validación real: el QA Agent puede ejecutar el código y ver si compila
- Reproducibilidad: mismo entorno siempre
- Seguridad: código generado por LLM no corre con privilegios del host

---

## 12. SISTEMA DE REVISIÓN

El ciclo de revisión es lo que diferencia OrchFlow de un generador simple:

```
Developer genera output
        │
        ▼
Tech Lead revisa:
  ✓ ¿Cumple el blueprint?
  ✓ ¿El código es coherente internamente?
  ✓ ¿Faltan archivos críticos?
        │
   ┌────┴────┐
APRUEBA   RECHAZA (con feedback específico)
   │            │
   ▼            ▼
Continúa   Developer re-genera (máx. 2 intentos)
                │
                ▼ (si falla 2 veces)
           Chief Architect notificado
           → simplifica el scope de ese módulo
           → el run termina con status: 'partial' y el qaReport lista
             explícitamente qué se degradó (visible para el usuario en UI/CLI).
             Nunca se entrega un scope reducido en silencio.
```

El QA Agent hace revisión cruzada al final:

```
QA verifica:
  ✓ package.json tiene los scripts que usa el Dockerfile
  ✓ Las importaciones del código existen en las dependencias
  ✓ Las variables de entorno en el código están en .env.example
  ✓ Los endpoints del backend coinciden con las llamadas del frontend
  ✓ npm run build no falla en el sandbox
```

---

## 13. CLI + APP DE ESCRITORIO — INTERFAZ Y PARIDAD

CLI y GUI son **dos clientes finos sobre `packages/core/src/actions/`**. Cada
comando del CLI tiene su equivalente exacto en la GUI y viceversa — la paridad es
por construcción, no una lista que hay que mantener sincronizada a mano.

| Acción de `core` | Comando CLI                     | En la GUI                       |
|------------------|---------------------------------|---------------------------------|
| `new`            | `orchflow new "..."`            | Pantalla Input → "Generate"     |
| `plan`           | `orchflow plan "..."`           | Pantalla Input → "Plan first"   |
| `history`        | `orchflow history`              | Pantalla Historial              |
| `show`           | `orchflow show <runId>`         | Detalle de run                  |
| `metrics`        | `orchflow metrics --agent ...`  | Pantalla Métricas               |
| `evalCompare`    | `orchflow eval compare ...`     | Pantalla Métricas → comparar    |

```bash
# Crear un nuevo proyecto
orchflow new "API REST para gestión de tareas con auth JWT y PostgreSQL"

# Con opciones
orchflow new "..." --level mvp --output ./my-project --stack fastapi

# Ver el plan antes de ejecutar (sin gastar tokens de generación)
orchflow plan "..."

# Listar runs anteriores / ver detalle
orchflow history
orchflow show <runId>

# Métricas y comparación de versiones de un agente
orchflow metrics --agent backend-dev
orchflow eval compare --agent backend-dev --baseline v1 --candidate v2

# Abrir la app de escritorio (si está instalada)
orchflow ui
```

La app de escritorio (Tauri) es la misma funcionalidad con interfaz visual, para
quien no usa terminal. Detalle de empaquetado e instaladores en §15.

---

## 14. GUI — PANTALLAS

> Estas pantallas son la app de escritorio (Tauri). En modo server, las mismas
> vistas se sirven por web. La data llega por IPC (embedded) o SSE (server).

### Pantalla 1: Input
- Textarea para el brief
- Selector de output level con descripción de cada nivel
- Estimación de tiempo y costo: heurística por nivel al elegir, recalculada con
  precisión al pulsar "Plan first" (no se llama al LLM en cada tecla)
- Botón "Plan first" (muestra el blueprint sin ejecutar) y "Generate"

### Pantalla 2: Ejecución en vivo
- Timeline de agentes con estado (pending / running / reviewing / done / failed)
- Log en tiempo real (IPC en embedded, SSE en server) — estilo terminal
- Preview de archivos generados apareciendo en tiempo real
- Métricas live: tokens usados, costo, tiempo transcurrido

### Pantalla 3: Resultado
- Árbol de archivos del proyecto generado
- Preview de archivos con syntax highlighting
- Reporte de QA (checks pasados / fallados, scores)
- Botón de descarga ZIP
- Botón "Open in VS Code"

### Pantalla 4: Historial
- Lista de runs anteriores con métricas clave
- Comparación de dos runs (diff de archivos generados)

### Pantalla 5: Métricas del sistema
- Build success rate por agente y versión (gráfico de línea)
- Scores de calidad por dimensión
- Costo por run en el tiempo
- Review rejection rate por agente

---

## 15. DISTRIBUCIÓN E INSTALADORES

OrchFlow se distribuye por dos canales, ambos sobre el mismo `core`:

**CLI** — vía npm
```bash
npm install -g orchflow      # global
npx orchflow new "..."       # sin instalar
```

**App de escritorio** — instaladores nativos con Tauri (footprint mínimo):

| OS      | Formato                | Tamaño aprox. |
|---------|------------------------|---------------|
| macOS   | `.dmg` (universal)     | ~6–10 MB      |
| Windows | `.msi` / `.exe` (NSIS) | ~6–10 MB      |
| Linux   | `.AppImage` + `.deb`   | ~6–10 MB      |

Por qué Tauri y no Electron:
- Instaladores ~10× más chicos (webview del sistema vs Chromium embebido)
- Menos RAM en ejecución
- Alineado con el principio de optimizar espacio y footprint (§16)

Costo: el `core` (Node/TS) corre como **sidecar** lanzado por el shell Rust; la
comunicación shell↔sidecar es por IPC. Es plomería de una sola vez.

**Build de releases:** GitHub Actions con matriz (macos / windows / ubuntu) genera
los tres instaladores + el paquete npm en cada tag. Binarios firmados donde aplique.

---

## 16. ECONOMÍA DE TOKENS

Principio rector del proyecto: **minimizar el consumo de tokens y de espacio sin
sacrificar estándares de industria ni el objetivo deploy-ready.** Reglas concretas:

| Regla | Dónde aplica |
|-------|--------------|
| Paso de contexto restrictivo: cada agente recibe solo su input definido | §9 |
| Manifiesto en vez de contenido completo para Tech Writer / QA / Assembler | §9 |
| **Prompt caching** de Anthropic: el system prompt de cada agente es estable y se cachea entre llamadas y runs | core/agents |
| Menos agentes = menos tokens: la capa Tech Lead se incorpora solo si paga su costo | §2 |
| Correr solo el nivel de output pedido — nunca generar trabajo extra | §1 |
| Checkpointing: un retry no re-ejecuta agentes ya exitosos | §3.3 |
| Sandbox/Docker solo cuando el nivel lo exige | §11 |
| Scoring determinista (build/parser) en vez de juez LLM donde se pueda | §6 |

**Medición:** `input_tokens` y `output_tokens` ya se registran por agente en
`agent_metrics` (§8). El target `cost per run` (§8) es el indicador que vigila que
estas reglas funcionen; si sube, alguna regla se está violando.

> Prompt caching es la palanca de mayor impacto: los system prompts de los agentes
> son largos y estables, así que cachearlos recorta el costo de input drásticamente
> en runs repetidos. Es lo primero a implementar al integrar la Claude API.

---

## 17. FASES DE IMPLEMENTACIÓN

### Fase 0 — Fundaciones (semana 1)
**Objetivo**: Monorepo funcionando, tipos definidos, primer agente real

- [ ] Setup monorepo con pnpm workspaces + TypeScript
- [ ] `packages/core/src/types/`: todos los contratos de datos
- [ ] `packages/core/src/agents/chief-architect/`: evaluación → blueprint
- [ ] `packages/core/src/agents/backend-dev/`: blueprint → archivos reales
- [ ] Tests de nivel 1 y 2 para ambos agentes
- [ ] Test de integración: brief → archivos en disco
- [ ] Dockerfiles base

**Gate**: `pnpm test` pasa Y hay archivos reales en `/tmp/orchflow-test/`

### Fase 1 — Equipo completo (semana 2–3)
**Objetivo**: Pipeline sin Tech Leads (Architect → Devs → QA → Writer), sin revisiones

- [ ] Frontend Developer agent
- [ ] DevOps (CI/CD + Infra) agent
- [ ] Tech Writer agent
- [ ] Assembler: consolida archivos sin conflictos
- [ ] Output ZIP funcional
- [ ] Sistema de métricas básico (latencia, tokens, costo)
- [ ] Prompt caching de los system prompts (§16) desde el primer agente

Los Tech Leads NO se implementan aún (ver nota de diseño §2): se agregan en una
iteración posterior solo si las métricas justifican su costo en tokens/latencia.

**Gate**: ZIP generado hace `npm install && npm run build` sin errores

### Fase 2 — Revisiones y QA (semana 4)
**Objetivo**: Sistema de revisión cruzada funcionando

- [ ] QA Reviewer agent
- [ ] Ciclo de revisión Developer → QA → re-trabajo (máx. 2 intentos)
- [ ] Sandbox Docker para validación real (niveles mvp/deliverable, §11)
- [ ] QA ejecuta build/lint en el sandbox
- [ ] Chief Architect maneja rechazos (degradación a `partial` visible)
- [ ] Scoring: deterministas (build/parser) + LLM-as-a-Judge solo para `quality`
- [ ] Métricas de calidad guardadas en SQLite
- [ ] (opcional) capa Tech Lead, si se decide medir su impacto

**Gate**: QA detecta y reporta inconsistencias en proyecto con errores plantados

### Fase 3 — CLI + App de escritorio (semana 5–6)
**Objetivo**: Las dos interfaces sobre `core/actions`, en modo embedded

- [ ] `packages/core/src/actions/`: API interna (new, plan, history, show, metrics, evalCompare)
- [ ] `packages/cli` (oclif): cliente fino sobre actions
- [ ] `packages/ui` (React): componentes de las pantallas (§14)
- [ ] `apps/desktop` (Tauri): shell + webview + `core` como sidecar; streaming por IPC
- [ ] Detección de Docker + guía cuando el nivel lo requiere (§11)
- [ ] Pantalla de métricas del sistema
- [ ] (opcional) `packages/server`: modo server con Fastify + Bull + Redis + SSE

**Gate (paridad)**: el mismo run se puede disparar por CLI y por la app, produce el
mismo output, y `npx orchflow new "..."` genera un ZIP válido sin levantar Redis.

### Fase 4 — Niveles de output (semana 7)
**Objetivo**: Los 4 niveles funcionando correctamente

- [ ] `blueprint`: solo arquitectura y docs
- [ ] `scaffold`: código base
- [ ] `mvp`: auth + DB + tests
- [ ] `deliverable`: todo + validaciones + error handling
- [ ] Suite de tests por nivel

**Gate**: Los 4 niveles producen outputs distintos verificados por `pnpm test:levels`

### Fase 5 — Evolución y open source (semana 8)
**Objetivo**: Sistema de mejora continua funcionando + listo para publicar

- [ ] Benchmark set de 10 briefs de referencia
- [ ] Comando `eval:regression` funcionando
- [ ] Experimentos A/B entre versiones de prompts
- [ ] README excelente (generado con OrchFlow)
- [ ] Documentación para agregar un nuevo agente
- [ ] `npm install -g orchflow` funciona
- [ ] Instaladores Tauri (.dmg / .msi / .AppImage+.deb) vía GitHub Actions matriz (§15)

**Gate**: El sistema de evolución rechaza automáticamente un prompt peor y promueve
uno mejor sobre el benchmark set, con criterio estadístico (Gate 5 → release, §5).

---

## 18. ESTRUCTURA PARA CONTRIBUCIÓN CONTINUA

### Convención de commits

```
feat(agents): add qa reviewer v1
fix(orchestrator): handle agent timeout gracefully
test(backend-dev): add contract tests for Node.js projects
prompt(backend-dev): v2 with improved file structure output
eval(backend-dev): v2 scores 12% higher than v1 on build success
refactor(core): extract context builder to separate module
docs(adr): add ADR-005 for rate limiting strategy
```

Las categorías `prompt` y `eval` son específicas de OrchFlow.
Hacen el historial de evolución de agentes legible de un vistazo.

### ADRs obligatorios

Escribir un ADR cuando:
- El cambio afecta más de un paquete del monorepo
- Se cambia una interfaz definida en AGENTS.md
- Se agrega una tecnología nueva al stack
- Se toma una decisión que podría ser cuestionada en 3 meses

No se necesita ADR para:
- Cambios internos a un paquete
- Mejoras de prompts (van en el CHANGELOG del agente)
- Fixes de bugs

### CHANGELOG por agente

```
packages/core/src/agents/backend-dev/
  CHANGELOG.md    ← historial de versiones con scores
  v1.prompt.ts
  v2.prompt.ts
  active.ts       ← apunta a la versión activa
```

### Para retomar el proyecto después de una pausa

1. Leer este documento (MASTER_PLAN.md)
2. Ver en qué fase está el proyecto: `git log --oneline -20`
3. Revisar el CHANGELOG de cada agente para ver dónde quedó la evolución
4. Correr `pnpm test` para confirmar el estado actual
5. Continuar desde el gate de la fase actual

---

## 19. DECISIONES TÉCNICAS CLAVE

| Decisión | Elección | Razón |
|----------|----------|-------|
| LLM provider | Anthropic Claude | Mejor instruction following para JSON estructurado |
| Distribución | CLI (npm) + app de escritorio | "Download & run" para devs y no-devs, con paridad |
| Shell de la GUI | Tauri | Instaladores chicos, footprint mínimo (vs Electron) |
| Despliegue default | Embedded (sin Redis) | "Download & run" sin levantar servidor |
| Cola de jobs | En memoria (embedded) / Bull+Redis (server) | Redis solo cuando hay concurrencia real |
| DB principal | SQLite (Drizzle) | Zero config, suficiente para v1, fácil migrar a PG |
| Streaming | IPC (embedded) / SSE (server) | Lo más simple según el modo |
| CLI | oclif | Production-grade, auto-help, testeable |
| Monorepo | pnpm workspaces | Types compartidos entre paquetes sin duplicación |
| Paridad CLI↔GUI | Ambos sobre `core/actions` | Una sola lógica, paridad por construcción |
| Comunicación entre agentes | Orquestador (no peer-to-peer) | Debuggable, testeable, observable |
| Selección de agentes | Dinámica (evaluador LLM) | Inteligente vs reglas hardcodeadas |
| Costo LLM | Prompt caching desde el día 1 | System prompts estables → ahorro grande (§16) |

---

## 20. LO QUE ORCHFLOW NO HACE (SCOPE EXPLÍCITO)

- **No deploya el proyecto generado** — entrega el ZIP, el deploy es tuyo
- **No usa memoria entre proyectos** en v1 — cada run es independiente. El
  historial SÍ se registra en SQLite, pero el Chief Architect recién lo *consume*
  para decidir (aprendizaje acumulado) en v2 (ver §9).
- **No genera tests con 100% de cobertura** — genera estructura y casos clave
- **No soporta todos los stacks** en v1 — Node.js/TypeScript y Python/FastAPI
- **No es un IDE** — genera archivos, no los edita interactivamente
- **No tiene multi-tenancy** en v1 — single-user, self-hosted
- **No confía en el brief como entrada segura** — el brief es texto libre y se
  genera+ejecuta código a partir de él. El sandbox sin red mitiga la *ejecución*,
  no impide que un brief adversario produzca contenido malicioso en el ZIP. Para
  v1 (self-hosted, single-user) el riesgo es bajo y queda del lado del usuario.

---

## 21. INSTRUCCIONES PARA CLAUDE CODE

### Orden de implementación — Fase 0

1. Setup del monorepo (pnpm workspaces, TypeScript, ESLint, Prettier)
2. `packages/core/src/types/index.ts` — todos los contratos de este documento
3. `packages/core/src/agents/chief-architect/` — con tests nivel 1 y 2
4. `packages/core/src/agents/backend-dev/` — con tests nivel 1 y 2
5. `packages/core/src/__tests__/integration.test.ts` — brief → archivos en disco
6. Dockerfiles base

### Principios de implementación

- Cada agente es una clase que implementa la interfaz `Agent`
- Los prompts de cada agente viven en archivos `.prompt.ts` separados del código
- Todo tiene tipos — no usar `any`
- Los tests son la documentación ejecutable de cada agente
- Los errores son explícitos — no silenciar excepciones
- Cada agente registra sus métricas (latencia, tokens, costo) en cada llamada
- Los prompts tienen número de versión explícito desde el primer commit

### No hacer en Fase 0

- No implementar CLI ni GUI
- No implementar todos los agentes — solo chief-architect y backend-dev
- No implementar el sandbox Docker todavía
- No implementar métricas avanzadas — solo el registro básico

El criterio de éxito de Fase 0 es simple y verificable:
`pnpm test` pasa Y existe `/tmp/orchflow-test/package.json` con contenido real.
