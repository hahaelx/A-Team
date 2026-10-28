---
description: 彙整所有 spec 的狀態、關卡與測試結果
---

1. 讀 `specs/README.md` 與每個 `specs/*/tasks.md`、`progress.md`（跳過 `_template`）。
2. 用 `gh pr list` 與 `gh issue list --label` 取得每個 spec 的 PR、CI 狀態與 label。
3. 輸出一張表：spec 編號｜標題｜目前關卡｜任務完成數／總數｜CI｜預覽網址｜卡住的問題｜負責人。
4. 最後列出「需要人類處理」的項目：等 BU 確認、等架構師核准、等 UAT、CI 失敗。
