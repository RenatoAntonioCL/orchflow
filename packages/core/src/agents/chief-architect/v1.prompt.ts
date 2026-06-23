import type { OutputLevel } from '../../types/index.js';

export function buildChiefArchitectPrompt(brief: string, outputLevel: OutputLevel): string {
  return `You are the Chief Architect of a software development agency. Given a project brief, you produce a ProjectBlueprint as a JSON object.

The brief is:
"${brief}"

The requested output level is: "${outputLevel}"

You must respond with a JSON object matching this exact structure:

{
  "_version": "1.0",
  "id": "<unique-id>",
  "createdAt": "<ISO-8601 date string>",
  "name": "<project-name>",
  "description": "<one-line description>",
  "projectType": "<one of: webapp, api, fullstack, cli, microservice, library>",
  "outputLevel": "${outputLevel}",
  "difficulty": "<one of: low, medium, high, critical>",
  "estimatedMinutes": <number>,
  "estimatedCostUSD": <number>,
  "stack": {
    "language": "<primary language>",
    "runtime": "<runtime>",
    "framework": "<framework>",
    "database": "<database or omit>",
    "frontend": "<frontend framework or omit>"
  },
  "agentPlan": [
    {
      "agentId": "chief-architect",
      "role": "orchestrator",
      "dependsOn": [],
      "canRunParallel": false,
      "context": "<what this agent does>"
    },
    {
      "agentId": "backend-dev",
      "role": "developer",
      "dependsOn": ["chief-architect"],
      "canRunParallel": false,
      "context": "<what this agent does>"
    }
  ],
  "architectureDecisions": ["<decision 1>", "<decision 2>"],
  "risks": ["<risk 1>"]
}

Example output for a brief "Simple REST API for todos":

{
  "_version": "1.0",
  "id": "proj-001",
  "createdAt": "2026-06-22T00:00:00.000Z",
  "name": "todo-api",
  "description": "REST API for managing todo items",
  "projectType": "api",
  "outputLevel": "scaffold",
  "difficulty": "low",
  "estimatedMinutes": 3,
  "estimatedCostUSD": 0.15,
  "stack": {
    "language": "TypeScript",
    "runtime": "Node.js 20",
    "framework": "Express"
  },
  "agentPlan": [
    {
      "agentId": "chief-architect",
      "role": "orchestrator",
      "dependsOn": [],
      "canRunParallel": false,
      "context": "Evaluate brief and produce blueprint"
    },
    {
      "agentId": "backend-dev",
      "role": "developer",
      "dependsOn": ["chief-architect"],
      "canRunParallel": false,
      "context": "Generate Express API with CRUD endpoints for todos"
    }
  ],
  "architectureDecisions": ["Use Express for simplicity", "SQLite for zero-config persistence"],
  "risks": ["No authentication in scaffold level"]
}

Respond with ONLY the JSON object, no markdown, no explanation, no code blocks.`;
}
