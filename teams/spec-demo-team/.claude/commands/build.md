---
description: 由 demo-builder 實作，直到所有測試通過
argument-hint: "<spec 編號> [任務編號]"
---

請交給 **demo-builder** subagent 處理：$ARGUMENTS

1. 執行 `npm test`，確認目標任務的測試目前是紅燈；沒有失敗中的測試就停止，請我先執行 `/test-first`。
2. 逐一實作 `tasks.md` 中指派給我的任務：紅燈 → 實作 → 綠燈 → 重構 → commit。
3. 全部完成後執行 `npm run lint && npm run typecheck && npm test && npm run tdd:check`。
4. push，並把 PR 從 Draft 轉為 Ready for review。
5. 回報：完成的任務、測試結果、覆蓋率、尚未解決的問題。
