# Spec-Demo Team

讓 5–10 人的團隊在 GitHub 上**多人一起寫規格**，用 Claude Code **測試先行**開發，**通過測試後自動部署到 AWS**（含 Amazon Bedrock）的 PoC／Demo 範本。

## 流程

```
BU 開 Issue（表單）
  → @claude /spec-new        spec-writer 產出需求與驗收條件      🚦 G1 BU 確認
  → @claude /design          architect 產出設計與 infra          🚦 G2 架構師核准
  → /test-first              test-engineer 先寫測試（紅燈）
  → /build                   demo-builder 實作到綠燈
  → CI 驗證 → 部署 PR 預覽環境 → E2E 驗收測試                      🤖 自動
  → /uat                     產生 UAT 清單                        🚦 G3 BU 驗收
  → code review（/review 先做 AI 審查）                            🚦 G4 工程師
  → 合併 main → 自動部署 demo 環境
```

## 角色

| 人類 | AI agent（`.claude/agents/`） |
|---|---|
| BU：提需求、確認規格、UAT | `spec-writer`：需求、驗收條件、UAT 清單 |
| 架構師：核准設計與 infra | `architect`：技術設計、ADR、CDK |
| 工程師：code review | `test-engineer`：先寫測試、E2E 驗收 |
| PM：排序、協調、貼 label | `demo-builder`：實作到測試通過 |
| | `reviewer`：安全、法遵、虛擬資產風險 |

## 目錄

```
CLAUDE.md                 團隊規則（每個 Claude session 自動讀取）
.claude/                  agents、指令、hooks（含 TDD guard）、權限設定
specs/                    規格：requirements → design → tasks → progress → uat
docs/                     參考架構、ADR、AWS 設定步驟
packages/api              Lambda（Bedrock Converse + DynamoDB）
packages/web              前端（Vite + React）
infra/                    AWS CDK
tests/e2e/                Playwright 驗收測試（對預覽環境執行）
scripts/                  TDD 檢查、region 檢查、GitHub 設定
.github/                  CI/CD、CODEOWNERS、BU 需求表單
```

## 開始使用

1. **建立專案 repo**：把這個資料夾的內容複製到一個新的 GitHub repo（或把那個 repo 設成 template repo，之後每個 demo 一鍵建立）。
2. **一次性設定 AWS 與 GitHub**：照 [`docs/aws-setup.md`](docs/aws-setup.md) 操作。
3. **本機開發**：
   ```bash
   npm ci
   npm test            # 單元測試（含覆蓋率門檻 80%）
   npm run tdd:check   # 每個實作檔都要有測試
   claude              # 啟動 Claude Code，會自動載入 CLAUDE.md 與團隊設定
   ```
4. **第一個需求**：請 BU 用「需求申請（BU）」表單開 Issue，PM 在 Issue 留言 `@claude /spec-new #<編號>`。

## 範本內建範例

`specs/000-ai-assistant/` 是一個已經完成的範例（AI 交易說明助理），示範：驗收條件 → 單元測試／E2E 測試 → 實作 → CDK 架構的完整對應。

## 已驗證／尚未驗證

- ✅ 已在本機驗證：單元測試全部通過（api、web、infra，覆蓋率 ≥ 90%）、lint、typecheck、`tdd:check`、`cdk synth`、TDD guard hook 擋下沒有測試的實作檔。
- ⏳ 需要在你們的 AWS 帳號驗證：實際部署、Bedrock 模型在台北的可用性、E2E 測試、GitHub Actions 工作流程。
