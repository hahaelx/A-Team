#!/usr/bin/env node
// PreToolUse hook：寫入實作檔之前，對應的測試檔必須已經存在（測試先行）。
// exit 2 會擋下這次寫入，stderr 的訊息會回饋給 Claude。
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expectedTests } from '../../scripts/tdd-map.mjs';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const rel = path.relative(root, path.resolve(root, filePath));
if (rel.startsWith('..')) process.exit(0);

const tests = expectedTests(rel);
if (!tests || tests.some((t) => existsSync(path.join(root, t)))) process.exit(0);

console.error(
  `TDD guard：${rel} 還沒有對應的測試檔。\n` +
    `請先撰寫 ${tests[0]}，執行並確認測試失敗（紅燈）後，再修改實作。`,
);
process.exit(2);
