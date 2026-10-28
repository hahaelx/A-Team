# 與上游同步

本 fork 只在以下位置與上游 `chemistrywow31/A-Team` 不同，其餘檔案保持原樣，方便合併上游更新：

| 路徑 | 改動 |
|---|---|
| `.gitignore` | 新增 `!teams/spec-demo-team/`，讓團隊範本被 Git 追蹤 |
| `readme.md` | 開頭加上本 fork 的用途說明 |
| `UPSTREAM.md` | 本檔案 |
| `teams/spec-demo-team/` | 我們自己的開發團隊範本（手寫精簡版，不是 `/A-Team` 產出） |

## 同步步驟

```bash
git remote add upstream https://github.com/chemistrywow31/A-Team   # 只需一次
git fetch upstream
git checkout main
git merge upstream/main          # 衝突只可能發生在 .gitignore 或 readme.md
git push origin main
```

## 注意

- 上游目前沒有 LICENSE 檔案。公司正式使用或對外散布前，請先向原作者確認授權。
- `scripts/validate-team.sh --all` 會把 `teams/spec-demo-team/` 當成 A-Team 產出的團隊檢查。它是刻意精簡的手寫範本（沒有 coordinator、`.worklog/` 等 A-Team 規範），檢查結果出現 FAIL 屬預期，不影響使用。
