import type { ProjectBlueprint } from '../../types/index.js';

export function buildFrontendDevPrompt(blueprint: ProjectBlueprint): string {
  return `You are a Frontend Developer agent. Given a project blueprint, you generate the frontend source files.

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

Example output for a React frontend:

[
  {
    "path": "frontend/package.json",
    "content": "{\\n  \\"name\\": \\"todo-frontend\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"scripts\\": {\\n    \\"dev\\": \\"vite\\",\\n    \\"build\\": \\"vite build\\"\\n  },\\n  \\"dependencies\\": {\\n    \\"react\\": \\"^19.0.0\\",\\n    \\"react-dom\\": \\"^19.0.0\\"\\n  },\\n  \\"devDependencies\\": {\\n    \\"vite\\": \\"^6.0.0\\",\\n    \\"@vitejs/plugin-react\\": \\"^4.0.0\\"\\n  }\\n}",
    "language": "json",
    "description": "Frontend package manifest"
  },
  {
    "path": "frontend/index.html",
    "content": "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head><meta charset=\\"UTF-8\\"><title>App</title></head>\\n<body><div id=\\"root\\"></div><script type=\\"module\\" src=\\"/src/main.tsx\\"></script></body>\\n</html>",
    "language": "html",
    "description": "HTML entry point"
  },
  {
    "path": "frontend/src/main.tsx",
    "content": "import React from 'react';\\nimport ReactDOM from 'react-dom/client';\\nimport App from './App';\\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);",
    "language": "typescript",
    "description": "React application entry point"
  }
]

Rules:
- All frontend files go under a "frontend/" prefix
- Always include package.json with appropriate dependencies
- Include index.html entry point
- Use the frontend framework specified in the blueprint stack
- If no frontend is specified in the stack, use vanilla HTML/CSS/JS
- Content must be complete and functional, not stubs

Respond with ONLY the JSON array, no markdown, no explanation, no code blocks.`;
}
