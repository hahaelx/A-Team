#!/usr/bin/env node
// CI 檢查：每個需要測試的實作檔，都必須有對應的測試檔。
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { expectedTests } from './tdd-map.mjs';

const root = process.cwd();
const roots = ['packages', 'infra/lib'];
const skipDirs = new Set(['node_modules', 'dist', 'cdk.out', 'coverage']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(path.relative(root, full));
  }
  return out;
}

const missing = [];
for (const file of roots.flatMap((r) => walk(path.join(root, r)))) {
  const tests = expectedTests(file);
  if (tests && !tests.some((t) => existsSync(path.join(root, t)))) {
    missing.push(`${file}  →  需要 ${tests[0]}`);
  }
}

if (missing.length) {
  console.error('TDD 檢查失敗：以下實作檔沒有對應的測試檔\n' + missing.join('\n'));
  process.exit(1);
}
console.log('TDD 檢查通過：所有實作檔都有對應的測試檔');
