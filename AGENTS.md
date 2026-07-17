# AGENTS.md

> **Expo HAS CHANGED**：本專案是 Expo SDK 56。寫任何程式碼前先讀對應版本文件 https://docs.expo.dev/versions/v56.0.0/


本專案採用 harness-engineering 工作流：先讀狀態、單一功能、憑證據收尾。
本檔只是路由。判準與範例一律看 `docs/harness/PLAYBOOK.md`，不要憑感覺判斷。

## 每個工作階段開始（依序執行，不可跳過）

1. `pwd` — 確認位於專案根目錄。
2. 讀 `claude-progress.md`：「目前已驗證狀態」區段 + 最新一筆工作階段記錄。
3. 讀 `feature_list.json`：若有 `in_progress` 的功能就繼續它；沒有才選 `priority` 數字最小且 `not_started` 的功能。
4. `git log --oneline -5` — 對照進度日誌與實際提交是否一致。
5. `./init.sh` — 若失敗，先修復到通過，才能做任何功能開發。

## 鐵律（違反任何一條 = 這個工作階段失敗）

- 同一時間只允許一個功能是 `in_progress`。
- 沒有實際執行過的指令與輸出，不得把功能改成 `passing`。
- 不得修改 `verification` 步驟來讓功能通過；確有必要修改時，需在 `notes` 記錄原因與日期，且不得降低驗證強度。
- 不得刪除或弱化測試來讓驗證通過。
- 資料庫 schema 變更或不可逆操作：先停下來詢問使用者。

## 完成門檻

功能可改成 `passing` 的唯一條件：`verification` 每一步都實際執行過，且 `evidence` 已依格式寫入（格式與判準見 PLAYBOOK §2、§3）。

## 每個工作階段結束（依序執行）

1. 更新 `feature_list.json`（狀態與 evidence）。
2. 在 `claude-progress.md` 的「## 工作階段日誌」標題正下方新增一筆記錄（最新在最上面）。
3. 逐項核對 `docs/harness/clean-state-checklist.md`。
4. 用描述性訊息 commit（不要 push，除非使用者要求）。

## 路由表

| 你要做的事 | 讀這個檔案 |
|---|---|
| 了解專案現況、上輪做到哪 | `claude-progress.md` |
| 選功能、改狀態、記證據 | `feature_list.json` |
| 判斷「算不算完成」「怎樣算證據」「卡住怎麼記」「範圍能不能擴」 | `docs/harness/PLAYBOOK.md` |
| 收尾自我檢查 | `docs/harness/clean-state-checklist.md` |
| 長工作階段結束的交接 | `docs/harness/session-handoff.md` |
| 安裝、驗證、啟動指令 | `init.sh`（頂端三個變數） |
