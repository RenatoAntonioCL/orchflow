# ADR-0001: TypeScript + pnpm monorepo + Hexagonal Architecture como base de OrchFlow

**Date:** 2026-06-20
**Status:** Accepted

## Context

OrchFlow es un orquestador de agentes autónomos. Necesita separar claramente el dominio (lógica de orquestación) de la infraestructura (LLM providers, herramientas externas, persistencia). El sistema debe ser testeable sin depender de APIs externas.

## Decision

- **TypeScript** para type safety en contratos entre agentes.
- **pnpm monorepo** para separar paquetes (`core`, `adapters`, `cli`) sin duplicar dependencias.
- **Hexagonal Architecture** para que el dominio no conozca la infraestructura — los providers de LLM son adaptadores intercambiables.

## Consequences

### Positive
- El core puede testearse con mocks sin depender de APIs externas.
- Agregar un nuevo LLM provider es crear un adaptador, no tocar el dominio.
- La separación en paquetes permite despliegue y versionado independiente.

### Negative
- La complejidad inicial es mayor que un monolito simple.
- Requiere disciplina para respetar los límites entre capas.

### Neutral
- La mantenibilidad a largo plazo justifica la inversión inicial en estructura.
