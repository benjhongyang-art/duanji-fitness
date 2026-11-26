# 鍛記

把每一次訓練留下來。這是給台灣使用者的手機優先健身紀錄，介面是繁體中文。訓練、課表、組間休息、歷史、體重和進步曲線都存在這台裝置的瀏覽器裡，沒有帳號，也不需要伺服器。可以加到主畫面，離線使用。

## 功能

- 開始一堂訓練，從肌群動作庫選動作（胸、背、腿、肩、手臂、核心、有氧），或自己新增。
- 重訓記錄重量（公斤）和次數；有氧記錄時間和距離。
- 把一組動作存成課表（預設有推、拉、腿），下次直接開練。
- 完成一組後的休息倒數，可加 15 秒或跳過。
- 歷史列表與單次細節。
- 體重（可選體脂 %）與動作進步曲線：最大重量、Epley 預估 1RM、總容量。
- 首頁顯示本週次數、連續天數、本週容量和最近訓練。
- 深色模式、匯出／匯入 JSON 備份。

## 本機開發

需要 Node.js 22 以上。

```bash
npm install
npm run dev
```

開發伺服器是 [http://127.0.0.1:47321](http://127.0.0.1:47321)。

```bash
npm test        # 資料邏輯測試
npm run lint
npm run build   # 產出 dist/，含 service worker 與 GitHub Pages 用的 404.html
npm run preview # 預覽正式建置
```

## 資料存在哪裡

IndexedDB 資料庫名稱是 `duanji`。清除網站資料或換瀏覽器之前，請到「設定」匯出備份。匯入會覆蓋這台裝置上的紀錄。

「設定」裡的「載入示範資料」會放進約八週的推、拉、腿和體重，用來看看曲線長什麼樣子。它會取代現有資料。

## 安裝與部署

正式建置是靜態檔，放在 `dist/`。用 HTTPS 開啟後，可以用瀏覽器的「加入主畫面」或「安裝應用程式」。Service worker 會快取畫面，沒有網路也能打開已看過的頁面。

單頁應用需要把所有路徑指回 `index.html`：

- Netlify：已附 `public/_redirects`
- Vercel：已附 `vercel.json`
- GitHub Pages：建置時會複製 `dist/404.html`。若網站不在網域根目錄，把 `vite.config.ts` 的 `base` 改成倉庫路徑後重新建置。

---

# Duanji

A mobile-first training log in Traditional Chinese. Workouts, routines, rest timers, history, body weight, and progress charts stay in the browser. There is no account and no backend. It installs as a PWA and works offline.

## Features

- Log a session from a built-in library grouped by muscle (chest, back, legs, shoulders, arms, core, cardio), or add a custom exercise.
- Strength sets store kilograms and reps. Cardio sets store duration and distance.
- Save a routine (push / pull / legs are seeded) and start a session from it.
- Rest timer between sets.
- History and per-workout detail.
- Body weight with optional body-fat percentage, plus per-exercise charts for max weight, estimated 1RM (Epley), and volume.
- Home shows this week’s count, streak, weekly volume, and recent sessions.
- Dark mode and JSON export / import.

## Run locally

Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:47321](http://127.0.0.1:47321).

```bash
npm test
npm run lint
npm run build
npm run preview
```

## Data

Everything is in an IndexedDB database named `duanji`. Export a JSON backup from Settings before clearing site data or switching browsers. Import replaces the data on this device.

“Load sample data” in Settings fills about eight weeks of push / pull / legs sessions and weigh-ins so the charts have something to draw. It replaces whatever is already stored.

## Install and deploy

`npm run build` writes a static `dist/` folder, including a service worker. Serve it over HTTPS and add it to the home screen from the browser. The service worker caches the app shell so visited screens open offline.

The app is a single-page client, so unknown paths must fall back to `index.html`:

- Netlify: `public/_redirects` is included.
- Vercel: `vercel.json` is included.
- GitHub Pages: the build copies `dist/404.html`. If the site is not served from the domain root, set `base` in `vite.config.ts` and rebuild.
