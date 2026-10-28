# AWS 與 GitHub 一次性設定

約 30–60 分鐘。需要一位具 AWS 管理員權限與 GitHub repo 管理員權限的人執行。

## 1. 確認 region 與 Bedrock 模型

```bash
aws sso login            # 或其他方式登入有管理員權限的帳號
scripts/check-region.sh
```

- 依結果決定 `AWS_REGION`（應用程式，首選 `ap-east-2`）、`BEDROCK_REGION`、`BEDROCK_MODEL_ID`。
- 到 **Bedrock Console → Model access** 申請要用的模型權限（台北或東京，看你選哪個 region）。

## 2. CDK bootstrap

```bash
npm ci
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
npx -w infra cdk bootstrap aws://$ACCOUNT/ap-east-2
```

Bedrock 用東京時，**不需要** bootstrap 東京；Lambda 在台北，直接跨 region 呼叫。

## 3. 建立 GitHub OIDC 部署角色

```bash
npx -w infra cdk deploy SpecDemoGithubOidc -c githubRepo=<owner>/<repo>
# 帳號已經有 GitHub OIDC provider 時，加上：
#   -c existingOidcProviderArn=arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com
```

記下輸出的 `DeployRoleArn`。

## 4. GitHub 設定

**Settings → Secrets and variables → Actions**

| 類型 | 名稱 | 值 |
|---|---|---|
| Variable | `AWS_DEPLOY_ROLE_ARN` | 第 3 步的 `DeployRoleArn` |
| Variable | `AWS_REGION` | `ap-east-2` |
| Variable | `BEDROCK_REGION` | `ap-east-2` 或 `ap-northeast-1` |
| Variable | `BEDROCK_MODEL_ID` | 第 1 步選定的模型 ID 或 inference profile ID |
| Secret | `BASIC_AUTH_USER` | 預覽／demo 網站帳號 |
| Secret | `BASIC_AUTH_PASSWORD` | 預覽／demo 網站密碼 |
| Secret | `CLAUDE_CODE_OAUTH_TOKEN` | 在本機執行 `claude setup-token` 取得（給 `@claude` 使用） |

**Settings → Environments**：建立 `preview` 與 `demo`。`demo` 可以加上 required reviewers，讓部署前再經人工確認。

**Claude GitHub App**：在本機 Claude Code 中執行 `/install-github-app`。

**Labels 與分支保護**：

```bash
scripts/setup-github.sh <owner>/<repo>
```

> ⚠️ 私有 repo 的分支保護與「必須 code owner 核准」需要 **GitHub Team 方案**（每人每月約 4 美元）。Free 方案下這些關卡無法強制，只能靠團隊自律。

## 5. 成本警示

**AWS Billing → Budgets**：建立每月預算（例如 100 美元），80% 時寄信通知。

## 6. 驗證

開一個小 PR（例如修改 README），確認：

1. `verify` 通過
2. `deploy-preview` 在 PR 留言預覽網址
3. `e2e` 通過，可下載 `e2e-report` artifact 看截圖
4. 關閉 PR 後，`cleanup-preview` 刪除 `SpecDemo-pr-N` stack

## 還原

```bash
npm run build && npx -w infra cdk destroy SpecDemo-demo -c stage=demo -c bedrockModelId=<id>   # DynamoDB 表會保留，需手動刪除
npx -w infra cdk destroy SpecDemoGithubOidc -c githubRepo=<owner>/<repo>
```
