# Changelog

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/)

## [Unreleased]

## [0.0.0] - 2026-06-22

### Added
- pnpm monorepo with TypeScript 5, ESLint 9, Prettier, Vitest
- Data contracts: `AgentId`, `AgentRole`, `OutputLevel`, `ProjectBlueprint`, `AgentOutput`, `GeneratedFile`, `RunResult`, `Provider`
- `OllamaProvider` — HTTP client for Ollama at localhost:11434
- `MockProvider` — predefined responses for unit tests, no network
- `chief-architect` agent with v1 prompt (brief → ProjectBlueprint JSON)
- `backend-dev` agent with v1 prompt (blueprint → GeneratedFile[] JSON)
- 13 unit tests: Level 1 (structure) + Level 2 (contracts) for both agents
- Integration test: Ollama qwen2.5-coder:7b → real files written to `/tmp/orchflow-test/`
- Phase 0 gate passed: `pnpm test` green + real files on disk
