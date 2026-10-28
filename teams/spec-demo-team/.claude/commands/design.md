---
description: 由 architect 產出技術設計、任務拆解與 infra 變更
argument-hint: "<spec 編號>"
---

請交給 **architect** subagent 處理 spec $ARGUMENTS：

1. 確認 `requirements.md` 已經 BU 確認（決策紀錄有 BU 確認紀錄，或 Issue 有 `spec:bu-approved` label）。沒有的話停止並告訴我。
2. 產出 `design.md` 與 `tasks.md`；需要 infra 變更時，先寫 `infra/test/` 再改 `infra/lib/`，並執行 `npm run synth` 與 `npm test -w infra`。
3. 新增的 AWS 服務要先用 `scripts/check-region.sh` 的方式確認台北可用性，並寫 ADR。
4. commit、push，在 PR 上請架構師 review。
