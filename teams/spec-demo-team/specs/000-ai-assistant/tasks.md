# SPEC-000 任務清單

| # | 任務 | AC | 先寫的測試 | 實作檔 | 負責人 | 大小 | 狀態 |
|---|---|---|---|---|---|---|---|
| T-1 | 讀取部署設定 | — | `packages/api/test/config.test.ts` | `packages/api/src/config.ts` | — | S | ✅ |
| T-2 | Bedrock 問答 | AC-2, AC-3 | `packages/api/test/assistant.test.ts` | `packages/api/src/assistant.ts` | — | S | ✅ |
| T-3 | 保存問答紀錄 | AC-4 | `packages/api/test/repository.test.ts` | `packages/api/src/repository.ts` | — | S | ✅ |
| T-4 | API 路由 | AC-1~AC-4 | `packages/api/test/handler.test.ts` | `packages/api/src/handler.ts` | — | M | ✅ |
| T-5 | 前端畫面 | AC-2, AC-3, AC-5 | `packages/web/test/App.test.tsx` | `packages/web/src/App.tsx` | — | S | ✅ |
| T-6 | AWS 架構 | 全部 | `infra/test/demo-stack.test.ts` | `infra/lib/demo-stack.ts` | — | M | ✅ |
| T-7 | E2E 驗收 | AC-1~AC-3, AC-5 | `tests/e2e/assistant.spec.ts` | — | — | S | ✅ |
