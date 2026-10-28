#!/usr/bin/env bash
# 檢查 AWS 服務與 Bedrock 模型在台北（ap-east-2）與東京（ap-northeast-1）的可用性。
# 用法：scripts/check-region.sh [額外服務代號...]    需要已登入的 AWS CLI。
set -euo pipefail

REGIONS=(ap-east-2 ap-northeast-1)
SERVICES=(cloudformation lambda apigateway dynamodb s3 cloudfront logs bedrock "$@")

for region in "${REGIONS[@]}"; do
  echo "=== ${region} ==="
  available=$(aws ssm get-parameters-by-path \
    --region us-east-1 \
    --path "/aws/service/global-infrastructure/regions/${region}/services" \
    --query 'Parameters[].Value' --output text | tr '\t' '\n')
  for svc in "${SERVICES[@]}"; do
    if grep -qx "$svc" <<<"$available"; then echo "  ✅ $svc"; else echo "  ❌ $svc"; fi
  done

  echo "  -- Bedrock：Anthropic 基礎模型（in-region）"
  aws bedrock list-foundation-models --region "$region" --by-provider anthropic \
    --query 'modelSummaries[].modelId' --output text 2>/dev/null | tr '\t' '\n' | sed 's/^/     /' || echo "     （無法查詢）"

  echo "  -- Bedrock：跨區推論 inference profile（可直接當作 bedrockModelId 使用）"
  aws bedrock list-inference-profiles --region "$region" \
    --query 'inferenceProfileSummaries[].inferenceProfileId' --output text 2>/dev/null | tr '\t' '\n' | grep -i anthropic | sed 's/^/     /' || echo "     （無法查詢或沒有）"
done

cat <<'MSG'

判斷方式（見 docs/decisions/0001-region-strategy.md）：
  1. 全部服務在 ap-east-2 都是 ✅ → appRegion=ap-east-2
  2. 需要的模型在 ap-east-2 可用（in-region 或 inference profile）→ bedrockRegion=ap-east-2
     否則 → bedrockRegion=ap-northeast-1，並選東京可用的模型或 profile
  3. 請記得到 Bedrock Console 的 Model access 申請模型使用權限
MSG
