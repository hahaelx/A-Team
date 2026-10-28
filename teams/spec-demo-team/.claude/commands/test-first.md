---
description: 由 test-engineer 依驗收條件先寫測試，並確認測試失敗（紅燈）
argument-hint: "<spec 編號>"
---

請交給 **test-engineer** subagent 處理 spec $ARGUMENTS：

1. 確認 `design.md` 已經架構師核准。沒有的話停止並告訴我。
2. 依每條 AC 撰寫單元測試與 E2E 測試，測試名稱以 `AC-n:` 開頭。
3. 執行 `npm test`，確認新測試全部失敗且原因正確，把紅燈摘要寫進 `progress.md`。
4. commit：`test(spec-{id}): failing tests for AC-1..AC-n`，push。
5. 回報：AC 與測試的對照表、紅燈數量。
