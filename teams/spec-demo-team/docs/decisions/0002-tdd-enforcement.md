# ADR-0002 強制測試先行

- 狀態：已採用
- 日期：2026-10-28

## 決策

用三層機制強制「先寫測試，才能寫實作」：

| 層 | 機制 | 擋下什麼 |
|---|---|---|
| 1. Claude Code | `.claude/hooks/tdd-guard.mjs`（PreToolUse hook） | 對應測試檔不存在時，禁止 Claude 寫入實作檔 |
| 2. CI | `npm run tdd:check` | 任何實作檔沒有對應測試檔，PR 無法合併 |
| 3. CI | Vitest 覆蓋率門檻 80% | 測試只是空殼、沒有真正測到實作 |

另外，`.claude/settings.json` 禁止 AI 修改 hook、TDD 檢查腳本、CI workflow 與 CODEOWNERS，避免 AI 為了通過檢查而改掉檢查本身。

## 檔案對應規則

| 實作 | 測試 |
|---|---|
| `packages/{pkg}/src/**/x.ts(x)` | `packages/{pkg}/test/**/x.test.ts(x)` |
| `infra/lib/x.ts` | `infra/test/x.test.ts` |

豁免：`*.d.ts`、`types.ts`、`packages/web/src/main.tsx`。

## 取捨

- Hook 只能確認「測試檔存在」，無法確認「測試先失敗過」。紅燈步驟由 test-engineer 記錄在 `progress.md`，並由 code review 確認。
- 人類工程師不受 hook 限制，但仍受 CI 的第 2、3 層限制。
- 若某類檔案確實不需要測試，在 `scripts/tdd-map.mjs` 的豁免清單加入，並經架構師 review。
