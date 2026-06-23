import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { GeneratedFile } from '../types/index.js';

export interface AssemblerResult {
  writtenFiles: string[];
  conflicts: string[];
}

export function assembleFiles(outputDir: string, fileSets: GeneratedFile[][]): AssemblerResult {
  const seen = new Map<string, number>();
  const merged: GeneratedFile[] = [];
  const conflicts: string[] = [];

  for (let i = 0; i < fileSets.length; i++) {
    for (const file of fileSets[i]) {
      const prev = seen.get(file.path);
      if (prev !== undefined) {
        // ponytail: last writer wins, conflict logged. Merge strategy if needed later.
        conflicts.push(`${file.path} (set ${prev} overwritten by set ${i})`);
      }
      seen.set(file.path, i);
      merged.push(file);
    }
  }

  const writtenFiles: string[] = [];
  for (const file of merged) {
    const fullPath = join(outputDir, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, 'utf-8');
    writtenFiles.push(file.path);
  }

  return { writtenFiles: [...new Set(writtenFiles)], conflicts };
}
