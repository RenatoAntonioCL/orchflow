import { describe, it, expect, beforeEach } from 'vitest';
import { createZip } from './zip.js';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';

const TEST_DIR = '/tmp/orchflow-zip-test';
const ZIP_PATH = '/tmp/orchflow-zip-test-output.zip';

beforeEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  if (existsSync(ZIP_PATH)) rmSync(ZIP_PATH);
  mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(`${TEST_DIR}/package.json`, '{"name":"test"}');
  writeFileSync(`${TEST_DIR}/index.js`, 'console.log("hi")');
});

describe('createZip', () => {
  it('creates a ZIP file from a directory', () => {
    const result = createZip(TEST_DIR, ZIP_PATH);
    expect(existsSync(result)).toBe(true);
  });

  it('throws if source directory does not exist', () => {
    expect(() => createZip('/tmp/nonexistent-dir-xyz', ZIP_PATH)).toThrow('does not exist');
  });
});
