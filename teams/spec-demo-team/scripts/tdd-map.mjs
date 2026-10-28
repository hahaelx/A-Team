// 實作檔 ↔ 測試檔的對應規則。TDD guard hook 與 CI 的 tdd-check 共用這份規則。
import path from 'node:path';

const EXEMPT = [
  /\.d\.ts$/,
  /(^|\/)types\.ts$/,
  /^packages\/web\/src\/main\.tsx$/,
  /^packages\/web\/src\/vite-env\.d\.ts$/,
];

// 傳入 repo 相對路徑；回傳應該存在的測試檔候選清單，不需要測試時回傳 null。
export function expectedTests(relPath) {
  const p = relPath.split(path.sep).join('/');
  if (!/\.(ts|tsx)$/.test(p) || EXEMPT.some((re) => re.test(p))) return null;

  let m = p.match(/^packages\/([^/]+)\/src\/(.+)\.(ts|tsx)$/);
  if (m) {
    const [, pkg, rest, ext] = m;
    const other = ext === 'tsx' ? 'ts' : 'tsx';
    return [`packages/${pkg}/test/${rest}.test.${ext}`, `packages/${pkg}/test/${rest}.test.${other}`];
  }
  m = p.match(/^infra\/lib\/(.+)\.ts$/);
  if (m) return [`infra/test/${m[1]}.test.ts`];
  return null;
}
