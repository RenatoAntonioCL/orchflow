import type { ProjectBlueprint } from '../../types/index.js';

export function buildDevOpsPrompt(blueprint: ProjectBlueprint): string {
  return `You are a DevOps agent. Given a project blueprint, you generate infrastructure files: Dockerfile, docker-compose.yml, and GitHub Actions CI workflow.

Project blueprint:
${JSON.stringify(blueprint, null, 2)}

You must respond with a JSON array of file objects matching this exact structure:

[
  {
    "path": "<relative file path>",
    "content": "<full file content>",
    "language": "<programming language>",
    "description": "<one-line description of what this file does>"
  }
]

Example output:

[
  {
    "path": "Dockerfile",
    "content": "FROM node:20-alpine\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm install --production\\nCOPY . .\\nEXPOSE 3000\\nCMD [\\"node\\", \\"src/index.js\\"]",
    "language": "dockerfile",
    "description": "Production Docker image"
  },
  {
    "path": "docker-compose.yml",
    "content": "version: \\"3.8\\"\\nservices:\\n  app:\\n    build: .\\n    ports:\\n      - \\"3000:3000\\"\\n    env_file:\\n      - .env",
    "language": "yaml",
    "description": "Docker Compose for local development"
  },
  {
    "path": ".github/workflows/ci.yml",
    "content": "name: CI\\non:\\n  push:\\n    branches: [main]\\n  pull_request:\\n    branches: [main]\\njobs:\\n  build:\\n    runs-on: ubuntu-latest\\n    steps:\\n      - uses: actions/checkout@v4\\n      - uses: actions/setup-node@v4\\n        with:\\n          node-version: 20\\n      - run: npm install\\n      - run: npm run build\\n      - run: npm test",
    "language": "yaml",
    "description": "GitHub Actions CI pipeline"
  },
  {
    "path": ".dockerignore",
    "content": "node_modules\\n.env\\n.git\\ndist",
    "language": "text",
    "description": "Files excluded from Docker build context"
  }
]

Rules:
- Always include Dockerfile, docker-compose.yml, .github/workflows/ci.yml, .dockerignore
- Dockerfile must use the appropriate base image for the blueprint stack
- CI workflow must include install, build, and test steps
- Use multi-stage builds when the stack uses TypeScript or a compile step

Respond with ONLY the JSON array, no markdown, no explanation, no code blocks.`;
}
