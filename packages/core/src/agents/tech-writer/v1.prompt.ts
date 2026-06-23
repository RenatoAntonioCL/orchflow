import type { ProjectBlueprint, GeneratedFile } from '../../types/index.js';

export function buildTechWriterPrompt(
  blueprint: ProjectBlueprint,
  existingFiles: GeneratedFile[],
): string {
  const fileList = existingFiles.map((f) => `- ${f.path}: ${f.description}`).join('\n');

  return `You are a Tech Writer agent. Given a project blueprint and the list of files already generated, you produce documentation files.

Project blueprint:
${JSON.stringify(blueprint, null, 2)}

Files already generated:
${fileList}

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
    "path": "README.md",
    "content": "# Project Name\\n\\nDescription.\\n\\n## Getting Started\\n\\n\`\`\`bash\\nnpm install\\nnpm run dev\\n\`\`\`\\n\\n## API Endpoints\\n\\n| Method | Path | Description |\\n|--------|------|-------------|\\n| GET | /items | List all items |\\n\\n## Project Structure\\n\\n\`\`\`\\nsrc/\\n├── index.ts\\n└── routes/\\n\`\`\`\\n\\n## License\\n\\nMIT",
    "language": "markdown",
    "description": "Project README with setup, API docs, and structure"
  },
  {
    "path": "CONTRIBUTING.md",
    "content": "# Contributing\\n\\n## Development Setup\\n\\n1. Clone the repo\\n2. Run \`npm install\`\\n3. Run \`npm run dev\`\\n\\n## Code Style\\n\\nThis project uses ESLint and Prettier.\\n\\n## Pull Requests\\n\\n- Create a branch from main\\n- Write tests for new features\\n- Ensure CI passes before requesting review",
    "language": "markdown",
    "description": "Contribution guidelines"
  }
]

Rules:
- Always generate README.md and CONTRIBUTING.md
- README must include: project description, getting started, API/usage docs, project structure, license
- CONTRIBUTING must include: setup, code style, PR process
- Reference actual files and endpoints from the generated project, not generic placeholders
- Do NOT regenerate files that already exist (package.json, source code, etc.)

Respond with ONLY the JSON array, no markdown, no explanation, no code blocks.`;
}
