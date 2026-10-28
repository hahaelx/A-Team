---
description: 由 spec-writer 依 Issue 或主題建立規格初稿
argument-hint: "<Issue 編號或需求主題>"
---

請交給 **spec-writer** subagent 處理以下需求：$ARGUMENTS

1. 若參數是 Issue 編號，先用 `gh issue view` 讀取內容與留言。
2. 依 `specs/_template/` 建立新的 `specs/{id}-{slug}/`，只填寫 `requirements.md`（狀態 `spec:draft`）並在 `specs/README.md` 登記。
3. 建立 branch `spec/{id}-{slug}`，commit 並 push，開 Draft PR，PR 描述連結 Issue。
4. 在 Issue 留下給 BU 看的白話摘要與「待確認問題」。
5. 回報：spec 編號、PR 連結、待確認問題數量。
