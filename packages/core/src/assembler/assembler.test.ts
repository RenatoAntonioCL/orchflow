import { describe, it, expect, beforeEach } from 'vitest';
import { assembleFiles } from './assembler.js';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedFile } from '../types/index.js';

const TEST_DIR = '/tmp/orchflow-assembler-test';

beforeEach(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  mkdirSync(TEST_DIR, { recursive: true });
});

const set1: GeneratedFile[] = [
  { path: 'package.json', content: '{"name":"test"}', language: 'json', description: 'Manifest' },
  { path: 'src/index.ts', content: 'console.log("hi")', language: 'typescript', description: 'Entry' },
];

const set2: GeneratedFile[] = [
  { path: 'Dockerfile', content: 'FROM node:20', language: 'dockerfile', description: 'Docker' },
  { path: 'README.md', content: '# Test', language: 'markdown', description: 'Readme' },
];

describe('assembleFiles', () => {
  it('writes all files from multiple sets to disk', () => {
    const result = assembleFiles(TEST_DIR, [set1, set2]);

    expect(result.writtenFiles).toHaveLength(4);
    expect(existsSync(join(TEST_DIR, 'package.json'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'src/index.ts'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'Dockerfile'))).toBe(true);
    expect(readFileSync(join(TEST_DIR, 'package.json'), 'utf-8')).toBe('{"name":"test"}');
  });

  it('detects conflicts when files overlap', () => {
    const overlap: GeneratedFile[] = [
      { path: 'package.json', content: '{"name":"override"}', language: 'json', description: 'Override' },
    ];
    const result = assembleFiles(TEST_DIR, [set1, overlap]);

    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0]).toContain('package.json');
    expect(readFileSync(join(TEST_DIR, 'package.json'), 'utf-8')).toBe('{"name":"override"}');
  });

  it('handles empty file sets', () => {
    const result = assembleFiles(TEST_DIR, [[], set1]);
    expect(result.writtenFiles).toHaveLength(2);
    expect(result.conflicts).toHaveLength(0);
  });
});
