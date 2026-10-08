# 長者關懷小幫手

輕量 PWA，三大功能：

- **布告欄**：記事新增 / 標記完成 / 刪除（localStorage 持久化）
- **運動建議**：依部位隨機抽取建議（內容待整合）
- **佈置遊戲**：拖曳家具到房間佈置（localStorage 自動存檔）

## 啟動方式

無需建構工具，直接以瀏覽器或手機開啟 `index.html` 即可使用。
若要部署為 PWA，建議透過 HTTPS 提供，並使用任何靜態伺服器：

```bash
npx serve .
```

## 檔案結構

```
新專案/
├── index.html
├── manifest.webmanifest
├── sw.js                  # Service Worker（離線快取）
├── offline.html           # 離線頁
├── css/style.css
├── js/
│   ├── store.js           # localStorage 封裝 (notes / prefs / room)
│   ├── board.js           # 布告欄
│   ├── exercise.js        # 運動建議（待整合內容）
│   ├── room.js            # 佈置遊戲
│   └── app.js             # Tab 切換 / PWA 註冊
└── icons/
    ├── icon.svg            # 主要圖示（佔位）
    ├── icon-192.png       # 待替換為正式 PNG
    └── icon-512.png       # 待替換為正式 PNG
```

## 佈置遊戲操作

- 點選下方物品欄的家具 → 在房間中央加入一份擺出
- 在房間內長按拖曳 → 自由擺放位置
- 拖曳到右上角垃圾桶 → 移除該家具
- 「重置房間」按鈕 → 清空所有擺設
- 佈置自動寫入 localStorage，下次開啟自動還原

## 待辦

- [ ] 整合運動建議內容（等使用者提供）
- [ ] 替換 `icons/icon-192.png` / `icon-512.png` 為正式 PNG
- [ ] 視需要新增「匯出 / 匯入」JSON 備份