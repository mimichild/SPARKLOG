# Harness Playbook — 判準與範例

本文件是 AGENTS.md 的深層說明。當你不確定「算不算完成」「怎麼記錄」「能不能做」時，答案在這裡，不要自行發明規則。

## 1. 功能狀態機

允許的狀態轉換（清單以外的一律禁止）：

```
not_started → in_progress   開始處理；全專案同時最多一個 in_progress
in_progress → passing       唯一條件：verification 全部實際執行過 + evidence 已寫入
in_progress → blocked       卡住；必須同時在 notes 記錄 blocker（格式見 §4）
blocked     → in_progress   blocker 解除後
passing     → in_progress   只有在發現回歸時；需在 notes 記錄回歸現象與日期
```

判準：

- 「程式碼寫完」不是一種狀態，不能因此改變 status。
- 想開始 A 功能但 B 功能還是 `in_progress`：先把 B 收成 `passing` 或 `blocked`，才能動 A。

## 2. 證據（evidence）格式

每一筆 evidence 是一個字串，固定格式：

```
"YYYY-MM-DD | 實際執行的指令 | 關鍵輸出摘要"
```

✅ 合格範例：

```
"2026-07-17 | pnpm exec vitest run src/wardrobe | Tests: 12 passed, 0 failed"
"2026-07-17 | curl -s localhost:3000/api/items | HTTP 200，JSON 含 3 筆 item"
"2026-07-17 | 手動操作：模擬器點擊 New Chat | 側邊欄出現新會話，主面板為空白對話"
```

❌ 不合格範例（寫了等於沒寫）：

```
"測試通過"           ← 沒有指令、沒有輸出，無法重現
"應該可以正常運作"   ← 猜測不是證據
"程式碼已完成"       ← 寫完不等於能動
```

判準：另一個人只看這一行字，能不能重跑同一個動作並比對結果？能 → 合格；不能 → 不合格。

## 3. 完成門檻的自我檢查

把 status 改成 `passing` 之前，逐項回答：

1. `verification` 裡的每一步，我都「實際執行」了嗎？（用讀程式碼推論的不算）
2. `evidence` 是否已依 §2 格式寫入？
3. `./init.sh` 現在跑仍會通過嗎？
4. 我有沒有為了通過而修改 `verification` 或刪弱測試？（有 → 撤銷）

常見自欺（出現這些念頭就停下來）：

| 念頭 | 事實 |
|---|---|
| 「程式碼寫完了，標 passing 吧」 | 沒執行 verification = 仍是 in_progress |
| 「這功能很簡單，不用驗」 | 簡單的功能也會壞；驗證通常只要 30 秒 |
| 「驗證環境跑不起來，先標 passing 之後再補」 | 跑不起來 = blocked，照 §4 記錄 |
| 「改一下 verification 步驟就能過了」 | 禁止；要改需在 notes 寫原因＋日期，且不得降低驗證強度 |
| 「上次跑過了，這次不用再跑」 | 程式碼改過就要重跑 |
| 「時間不夠了，直接標完成」 | 時間不夠就如實留在 in_progress，寫進交接 |

## 4. blocked 的正確記法

status 改為 `blocked` 時，`notes` 必須包含三件事：**卡住的具體現象、已嘗試的方法、建議解法（或需要使用者決定的事）**。

範例：

```json
"status": "blocked",
"notes": "2026-07-17 blocked：init.sh 的 pnpm test 卡住不結束。已試：清除 node_modules 重裝（無效）、改用 npx vitest（無效）。疑似 vitest 預設 watch 模式，建議把 VERIFY_CMD 改為 pnpm exec vitest run，需使用者確認。"
```

## 5. 進度日誌（claude-progress.md）寫法

- 「目前已驗證狀態」永遠反映最新事實，每次收尾都要更新。
- 新的工作階段記錄插在「## 工作階段日誌」標題正下方（最新在最上面）。
- 編號遞增：上一筆是 007，這筆就是 008。

完整範例：

```markdown
### 工作階段 008

- 日期：2026-07-17
- 本輪目標：完成 wardrobe-002 衣櫃列表分頁
- 已完成：實作分頁元件與 API 參數；順修 blocker（vitest watch 模式）
- 執行過的驗證：pnpm exec vitest run src/wardrobe（12 passed）；模擬器手動確認滑到底會載入下一頁
- 已擷取證據：已寫入 feature_list.json 的 wardrobe-002.evidence
- 提交記錄：a1b2c3d feat: 衣櫃列表分頁
- 已知風險或未解決問題：分頁在離線模式未測
- 下一步最佳動作：處理 wardrobe-003（priority 3）
```

## 6. 新增功能到 feature_list.json

- `id`：`區域-三位數字`，例如 `wardrobe-004`。同區域編號遞增，不重複使用已刪除的編號。
- `priority`：整數，越小越優先。插隊可用不連續數字（例：15 插在 10 與 20 之間），不必重排全部。
- `user_visible_behavior`：一句話，從使用者視角描述「功能正常時使用者會看到什麼」，不寫實作細節。
- `verification`：3–6 步，每步是一個可直接執行的動作或檢查，照著做就能完成，不需要額外判斷。

## 7. 範圍紀律

處理功能 A 時發現別的問題：

- **阻擋 A 的小修補**（同時滿足：約 30 行以內、不新增依賴、不改公開介面）→ 可以直接修，在本輪日誌記一筆。
- **超過上述任一條件** → 不要修。在 feature_list.json 新增一個項目記錄它，回頭繼續做 A。
- **純粹「順手想改」的重構** → 一律新增項目，不要現在做。

## 8. 提交規則

- 時機：`./init.sh` 通過、進度日誌與功能清單都已更新之後。
- 一個工作階段至少一個 commit（除非完全沒有改動）。
- 不要 push，除非使用者要求。
- 訊息格式沿用專案慣例（看 `git log --oneline -5` 就知道）。

## 9. 收尾與交接

- 每次收尾逐項核對 `clean-state-checklist.md`。
- 長工作階段（改動多、風險高、跨多個區域）另填 `session-handoff.md`。
