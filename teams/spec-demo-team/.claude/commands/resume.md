---
description: 接續某個 spec 的工作，摘要目前進度與建議下一步
argument-hint: "<spec 編號>"
---

接續 spec $ARGUMENTS 的工作：

1. `git fetch` 並切到該 spec 的 branch（`spec/{id}-*`），`git pull`。
2. 讀 `specs/{id}*/` 的 `requirements.md`、`design.md`、`tasks.md`、`progress.md`。
3. 用 `gh` 查看對應 Issue 與 PR 的最新留言、CI 狀態與 label。
4. 執行 `npm test`，了解目前紅燈與綠燈的狀況。
5. 用 10 行內摘要告訴我：目前在哪個關卡、上一位停在哪裡、有哪些待確認問題、建議我接哪個任務。
6. **先等我確認，不要直接開始修改。**
