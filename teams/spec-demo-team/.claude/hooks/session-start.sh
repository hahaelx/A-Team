#!/bin/sh
# SessionStart hook：把所有 spec 的狀態放進 Claude 的上下文。
D="${CLAUDE_PROJECT_DIR:-.}"
if [ -f "$D/specs/README.md" ]; then
  echo "=== 目前規格狀態（specs/README.md）==="
  cat "$D/specs/README.md"
  echo "提醒：接續工作請先執行 /resume <spec 編號>；收工前執行 /handoff。"
fi
exit 0
