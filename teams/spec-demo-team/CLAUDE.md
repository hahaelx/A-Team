# Spec-Demo Team

多人在 GitHub 上一起寫規格，**測試先行**開發，通過測試後自動部署到 AWS（含 Amazon Bedrock）的 PoC / Demo 團隊。

## 開工前必做

1. 讀 `specs/README.md`，了解所有規格的狀態。
2. 要接續某個 spec 時，先讀 `specs/{id}/` 下的 `requirements.md`、`design.md`、`tasks.md`、`progress.md`，再用 `gh issue view` 看對應 Issue 的最新留言（或直接執行 `/resume {id}`）。
3. 不可推翻 `docs/decisions/` 與規格「決策紀錄」裡已記錄的決策。有疑慮就寫進規格的「待確認問題」或在 Issue 提出。

## 流程與關卡

```
BU 開 Issue → /spec-new → 🚦G1 BU 確認 requirements
→ /design → 🚦G2 架構師核准 design
→ /test-first（測試必須先失敗）→ /build（直到測試全部通過）
→ 🤖 CI：lint、typecheck、單元測試＋覆蓋率、TDD 檢查、cdk synth
→ 🤖 部署 PR 預覽環境 → 🤖 E2E 驗收測試
→ /uat → 🚦G3 BU 在預覽網址做 UAT → 🚦G4 工程師 code review
→ 合併 main → 🚀 自動部署 demo 環境
```

- 關卡由人類決定；AI 不能自己宣告通過任何 🚦 關卡。
- 規格狀態用 Issue／PR label 表示：`spec:draft` → `spec:bu-approved` → `design:approved` → `build:in-progress` → `uat:ready` → `uat:passed` → `deployed`。

## 角色

| AI agent | 負責 | 對應的人類關卡 |
|---|---|---|
| `spec-writer` | `requirements.md`、驗收條件（AC）、UAT 清單 | BU 確認（G1）、UAT（G3） |
| `architect` | `design.md`、ADR、`infra/` | 架構師核准（G2） |
| `test-engineer` | 依 AC 先寫測試，E2E 驗收 | — |
| `demo-builder` | 實作，直到測試全部通過 | 工程師 code review（G4） |
| `reviewer` | 安全、法遵、虛擬資產風險審查 | — |

每個 agent 只能寫自己負責的檔案，詳見各 agent 檔案的「可寫入路徑」。

## 測試先行（強制）

1. **沒有測試，不准寫實作。** 修改 `packages/*/src/**` 或 `infra/lib/**` 之前，對應的測試檔必須已經存在，否則 `.claude/hooks/tdd-guard.mjs` 會擋下寫入。
   - `packages/api/src/foo/bar.ts` → `packages/api/test/foo/bar.test.ts`
   - `packages/web/src/Foo.tsx` → `packages/web/test/Foo.test.tsx`
   - `infra/lib/foo.ts` → `infra/test/foo.test.ts`
2. 順序固定：寫測試 → 執行並**確認失敗**（紅）→ 寫實作 → 執行並確認通過（綠）→ 重構。
3. 每條驗收條件（`AC-n`）至少對應一個測試，測試名稱開頭標註 AC 編號，例如 `it('AC-2: 新增地址後 24 小時內不可出金', ...)`。
4. **禁止為了讓測試通過而修改或刪除測試的斷言。** 測試本身有錯時，在 `progress.md` 說明原因，交由人類決定。
5. 單元測試覆蓋率門檻 80%（lines／functions／branches／statements），設定在各 package 的 `vitest.config.ts`。

## 技術與架構（Demo 模式，不討論替代方案）

- 詳見 `docs/architecture.md` 與 `docs/decisions/`。
- 語言：TypeScript（Node.js 22）。單一 repo，npm workspaces：`packages/web`、`packages/api`、`infra`。
- 前端：Vite + React，部署在 S3 + CloudFront。
- 後端：API Gateway HTTP API + Lambda；資料存 DynamoDB；AI 透過 Amazon Bedrock Converse API。
- IaC：AWS CDK（TypeScript）。所有 AWS 資源都必須由 `infra/` 建立，禁止手動在 Console 建立。
- Region：應用程式部署在台北 `ap-east-2`；台北沒有的服務或模型才用東京 `ap-northeast-1`。region 與 Bedrock 模型一律從設定讀取，**禁止寫死在程式碼裡**（見 `docs/decisions/0001-region-strategy.md`）。
- Demo 規則：
  - 只做規格「Demo 範圍」列出的項目。
  - 鏈上互動只能用 testnet 或 mock，禁止 mainnet、禁止真實私鑰與真實客戶資料。
  - 登入、KYC 可以用假資料直接通過，畫面上要標示「DEMO」。

## 安全與法遵

- 金額一律用整數最小單位（bigint／字串）或 decimal 函式庫，**禁止使用浮點數**。
- 禁止把任何金鑰、私鑰、助記詞、AWS 憑證寫進程式碼、測試、規格或 commit。設定值放在 CDK context 或 SSM Parameter Store。
- 送進 Bedrock 的內容不得包含真實個資或客戶資料。
- AI 不得修改 `.github/workflows/**`、`.github/CODEOWNERS`、`.claude/settings.json`、`.claude/hooks/**`（由 `.claude/settings.json` 的 deny 規則強制）。

## 多人協作規則

1. 一個 spec 對應一個 Issue、一個 branch：`spec/{id}-{slug}`。
2. 規格的每個段落都標有負責人（`<!-- owner: @xxx -->`）。只能修改目前使用者負責的段落；其他段落的修改建議寫進「待確認問題」。
3. 規格合併到 `main` 之後即凍結，要改就開新的 PR。
4. `tasks.md` 的每個任務只有一位負責人。開始做之前先確認沒有人在做。
5. 收工前執行 `/handoff`，把進度寫進 `progress.md` 並 commit、push。**進度只寫在 repo 和 Issue 裡，不要只留在自己的對話中。**

## 常用指令

| 指令 | 用途 |
|---|---|
| `/spec-new <主題或 Issue 編號>` | 建立規格初稿 |
| `/design <id>` | 產出技術設計與 infra 變更 |
| `/test-first <id>` | 依驗收條件先寫測試（應該失敗） |
| `/build <id>` | 實作直到測試全部通過 |
| `/review <id>` | 安全、法遵、程式碼審查 |
| `/uat <id>` | 產生給 BU 的 UAT 清單 |
| `/resume <id>` | 接續別人的進度 |
| `/handoff` | 收工交接 |
| `/status` | 彙整所有 spec 狀態 |

## 常用命令

```bash
npm ci                    # 安裝
npm test                  # 全部單元測試（含覆蓋率門檻）
npm run lint && npm run typecheck
npm run tdd:check         # 檢查每個實作檔都有對應測試
npm run synth             # cdk synth
npm run test:e2e          # 對 E2E_BASE_URL 跑 Playwright 驗收測試
```
