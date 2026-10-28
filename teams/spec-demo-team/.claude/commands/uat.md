---
description: 由 spec-writer 產生給 BU 的 UAT 驗收清單並通知 BU
argument-hint: "<spec 編號>"
---

請交給 **spec-writer** subagent 處理 spec $ARGUMENTS：

1. 從 PR 留言中找出最新的預覽網址，以及 E2E 測試結果與截圖。
2. 依 `requirements.md` 的每一條 AC 產生 `specs/{id}/uat.md`：操作步驟、預期結果、E2E 是否已通過、BU 勾選欄。
3. commit、push，並在 Issue @BU：附上預覽網址、登入方式（Basic Auth 帳密請向 PM 取得，不要寫在留言裡）與 UAT 清單連結。
4. 建議 PM 加上 `uat:ready` label。
