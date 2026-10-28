#!/usr/bin/env bash
# 一次性：建立流程 label 與 main 分支保護。用法：scripts/setup-github.sh owner/repo
# 需要 gh CLI 且具 repo admin 權限。私有 repo 的分支保護需要 GitHub Team（或以上）方案。
set -euo pipefail
REPO="${1:?用法：scripts/setup-github.sh owner/repo}"

labels=(
  "spec:draft|cccccc|規格草稿"
  "spec:bu-approved|0e8a16|BU 已確認需求（Gate 1）"
  "design:approved|1d76db|架構師已核准設計（Gate 2）"
  "build:in-progress|fbca04|測試先行與實作中"
  "uat:ready|d93f0b|預覽環境可供 BU 驗收"
  "uat:passed|0e8a16|BU 驗收通過（Gate 3）"
  "deployed|5319e7|已部署到 demo 環境"
)
for l in "${labels[@]}"; do
  IFS='|' read -r name color desc <<<"$l"
  gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force
done

# 必須通過的檢查：驗證與 E2E。必須有 code owner 核准。禁止 force push。
gh api -X PUT "repos/${REPO}/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verify / verify", "e2e"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
echo "完成。請到 GitHub Settings → Branches 確認 required checks 名稱與實際 workflow 的 check 名稱一致。"
