import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export function createZip(sourceDir: string, outputPath: string): string {
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory does not exist: ${sourceDir}`);
  }

  const absOutput = join(dirname(outputPath), basename(outputPath));
  execSync(`zip -r "${absOutput}" .`, { cwd: sourceDir, stdio: 'pipe' });

  if (!existsSync(absOutput)) {
    throw new Error(`ZIP creation failed: ${absOutput}`);
  }

  return absOutput;
}
