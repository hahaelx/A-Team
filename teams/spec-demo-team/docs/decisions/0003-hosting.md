# ADR-0003 部署方式：CDK（CloudFront + S3 + Lambda），不使用 Amplify Hosting

- 狀態：已採用
- 日期：2026-10-28

## 決策

前端與後端都用 AWS CDK 部署，每個 PR 由 GitHub Actions 建立獨立的預覽 stack。

## 原因

- Demo 需要完整後端（Lambda、DynamoDB、Bedrock），前後端用同一套 IaC 管理比較單純。
- 首選 region 是台北，Amplify Hosting 在台北的可用性未確認；CloudFront、S3、Lambda 等基礎服務比較確定。
- 「測試通過才部署」由 GitHub Actions 的 job 相依關係與 branch protection 控制，流程集中在一處。

## 取捨

- 每個 PR 預覽 stack 首次建立約需 5–10 分鐘（CloudFront 建立較慢）。
- 若之後確認 Amplify 在台北可用，且前端需要 SSR，可重新評估。
