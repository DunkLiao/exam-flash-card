# 快閃卡 FlashCard

一個用 React、TypeScript、Vite 與 Tauri 製作的桌面快閃卡工具。可建立牌組與卡片、使用 Markdown 編輯內容、進行複習與測驗，並透過檔案匯入/匯出保存資料。

## 功能

- 建立牌組並管理多張快閃卡
- 卡片內容支援 Markdown 與 GFM 語法
- 複習模式與測驗模式
- 以間隔重複邏輯安排複習
- 匯入與匯出牌組資料
- 可打包成 Windows portable EXE

## 系統需求

- Node.js LTS
- npm
- Rust toolchain
- Tauri 2 在 Windows 上需要 Microsoft C++ Build Tools

## 安裝

在專案根目錄執行：

```bash
npm install
```

## 開發模式

啟動 Tauri 桌面開發模式：

```bash
npm run tauri:dev
```

Windows 也可以直接執行：

```bat
dev.bat
```

若只想啟動前端 Vite 開發伺服器：

```bash
npm run dev
```

## 建置與打包

建立前端 production build：

```bash
npm run build
```

打包 Tauri 桌面程式：

```bash
npm run tauri:build
```

Windows portable EXE 包裝流程：

```bat
build.bat
```

完成後輸出位置：

```text
portable/FlashCard/FlashCard.exe
```

## 品質檢查

```bash
npm run lint
npm run build
```

目前尚未設定自動化測試框架。調整匯入/匯出、複習排程或 Tauri 檔案權限時，請額外用 `npm run tauri:dev` 手動驗證主要流程。

## 專案結構

```text
src/
  App.tsx              # 應用程式主要畫面切換
  components/          # 牌組、卡片、複習、測驗、匯入匯出元件
  hooks/               # 應用資料狀態與操作
  types/               # 共用 TypeScript 型別
  utils/               # 檔案 I/O 與間隔重複邏輯
public/                # 靜態公開資源
src-tauri/             # Tauri 設定與 Rust 桌面端程式
portable/              # build.bat 產生的 portable EXE 輸出
```

## 注意事項

- `dist/`、`node_modules/`、`src-tauri/target/` 與 `portable/` 是產物或本機依賴，不應提交。
- Tauri 權限設定在 `src-tauri/capabilities/default.json`，擴充檔案系統、剪貼簿或對話框能力前請先檢查權限範圍。
