# ADR-0001 Region 策略：台北優先，東京備援

- 狀態：已採用
- 日期：2026-10-28

## 決策

1. 應用程式（Lambda、API Gateway、DynamoDB、S3）部署在台北 `ap-east-2`。
2. Bedrock 的 region 與模型 ID 是獨立設定（CDK context `bedrockRegion`、`bedrockModelId`）：
   - 需要的模型在台北可用（in-region 或跨區推論 inference profile）→ 用台北。
   - 台北沒有 → 用東京 `ap-northeast-1`。Lambda 仍在台北，跨 region 呼叫東京的 Bedrock。
3. 其他服務若台北沒有，也改用東京，並另寫 ADR 記錄。
4. 程式碼不得寫死 region 或模型 ID；一律由 CDK 注入環境變數。

## 原因

- 業務與資料以台灣為主，資料落地在台北較容易向法遵說明。
- 台北 region 較新，部分服務與模型可能尚未上線。把 Bedrock 的 region 獨立出來，可以在不搬動其他資源的情況下切換。
- 根據 Bedrock 文件，`bedrock-runtime` endpoint 已在 ap-east-2 提供，但各模型的可用性要另外確認。

## 如何確認

執行 `scripts/check-region.sh`（使用 AWS SSM 公開參數與 `aws bedrock list-*` 查詢），並到 Bedrock Console 申請模型使用權限。

## 注意

- 跨區推論 inference profile（例如 `apac.` 開頭）可能把請求路由到亞太其他 region 處理。若法遵要求資料不能離開特定國家，請改用 in-region 模型，並在此 ADR 補充。
- 跨 region 呼叫會增加少量延遲與資料傳輸費用。
