# OrchFlow

> Una **agencia de desarrollo de software autónoma** impulsada por LLMs.
> Dado un requerimiento en lenguaje natural, un equipo de agentes especializados
> —con jerarquía, revisiones cruzadas y roles definidos— entrega un proyecto de
> software real: funcional, documentado y listo para continuar.

![estado](https://img.shields.io/badge/estado-planificaci%C3%B3n%20(pre--Fase%200)-orange)
![licencia](https://img.shields.io/badge/licencia-MIT-blue)
![plan](https://img.shields.io/badge/master%20plan-v2.1-success)

> 🇪🇸 Este proyecto se documenta en español. El plan técnico completo está en
> **[`MASTER_PLAN.md`](./MASTER_PLAN.md)**.

---

## Qué es

OrchFlow **no** es un generador de scaffolding, un chatbot, ni un wrapper de LangChain.

Es un sistema donde cada agente tiene un rol, responsabilidades y criterios de
aceptación, y puede **rechazar o pedir revisión** del trabajo de otros agentes.
El usuario describe lo que quiere, elige cuánto quiere que se construya, y OrchFlow
coordina al equipo para entregarlo.

### Niveles de output (lo elige el usuario)

| Nivel | Qué entrega | Tiempo est. |
|-------|-------------|-------------|
| `blueprint` | Arquitectura, ADRs, estructura de carpetas, contratos de API | < 1 min |
| `scaffold` | + código base funcional, configs, CI/CD, Dockerfile | 2–4 min |
| `mvp` | + auth, DB con migraciones, tests, README completo | 5–10 min |
| `deliverable` | + validaciones, error handling, logging, deploy-ready | 10–20 min |

### El equipo de agentes

```
            CHIEF ARCHITECT  (orquesta, evalúa, ensambla)
                   │
      ┌────────────┼─────────────┐
   Backend       Frontend       DevOps
    (TL+Dev)      (TL+Dev)     (CI/CD+Infra)
      └─────┬──────┘
            ▼
        QA / REVIEWER  →  TECH WRITER
```

---

## Cómo se va a usar

OrchFlow se distribuye en dos formas, con **paridad total** (todo lo del CLI está
también en la app):

- **CLI** — `npx orchflow new "API REST con auth JWT y PostgreSQL"`
- **App de escritorio** — instaladores nativos y livianos (Tauri) para
  **Linux, macOS y Windows**

Por defecto corre en modo *embedded* (sin servidor ni Redis): se baja y se usa.

---

## 🗺️ Roadmap — síguelo semana a semana

Cada fase termina en un **gate**: una pregunta binaria con evidencia ejecutable.
No se avanza de fase sin pasar el gate.

| Fase | Semana | Objetivo | Gate (cómo se verifica) | Estado |
|------|--------|----------|-------------------------|--------|
| **0** | 1 | Monorepo, tipos, primeros 2 agentes | `pnpm test` verde + archivos reales generados | ⬜ Pendiente |
| **1** | 2–3 | Equipo completo (sin revisiones) | ZIP generado hace `npm install && build` sin errores | ⬜ Pendiente |
| **2** | 4 | Revisiones cruzadas + QA en sandbox | QA detecta inconsistencias plantadas | ⬜ Pendiente |
| **3** | 5–6 | CLI + app de escritorio (paridad) | Mismo run por CLI y GUI, sin Redis | ⬜ Pendiente |
| **4** | 7 | Los 4 niveles de output | Cada nivel produce un output distinto y coherente | ⬜ Pendiente |
| **5** | 8 | Evolución de agentes + open source | El sistema A/B rechaza un prompt peor y promueve uno mejor | ⬜ Pendiente |

**Estado actual:** planificación terminada (Master Plan v2.1). Fase 0 por arrancar.

---

## Cómo seguir el proyecto

- ⭐ **Watch / Star** este repo para ver cada avance.
- Revisa los **commits**: usan categorías propias que hacen legible la evolución.
  - `prompt(<agente>): ...` — cambios en el prompt de un agente
  - `eval(<agente>): ...` — resultados de comparar versiones de un agente
  - además de `feat`, `fix`, `test`, `refactor`, `docs`.
- Cada agente llevará su propio `CHANGELOG.md` con scores por versión.

---

## Stack (resumen)

- **Core / engine:** Node.js 20 + TypeScript, Anthropic Claude API (con prompt caching)
- **Persistencia:** SQLite (Drizzle ORM)
- **Sandbox de validación:** Docker (atado al nivel de output)
- **CLI:** oclif · **App de escritorio:** Tauri (React + Tailwind)
- **Monorepo:** pnpm workspaces

Principio rector: **optimizar al máximo tokens y espacio** sin resignar estándares
de industria ni el objetivo de proyectos listos para deploy.

---

## Documentación

- 📘 **[`MASTER_PLAN.md`](./MASTER_PLAN.md)** — el documento técnico completo:
  arquitectura, contratos de datos, gates, evolución de agentes, testing, métricas,
  infraestructura, distribución y fases.

---

## Licencia

[MIT](./LICENSE)
