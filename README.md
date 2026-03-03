# 📚 閱讀清單 Reading List

> 個人閱讀紀錄管理系統，支援新增、編輯、刪除書籍，並可依狀態與評分篩選。

## 🛠 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Vue 3、Vite、Axios |
| 後端 | Node.js、Express |
| 資料庫 | MySQL |
| 工具 | Git、MySQL Workbench |

## ✨ 功能特色

- 📖 書籍 CRUD（新增、編輯、刪除）
- 🔍 即時關鍵字搜尋（書名、作者、類別）
- 🏷 依閱讀狀態篩選（已讀 / 進行中 / 待讀）
- ⭐ 評分系統（0–3 顆，待讀與進行中不可評分）
- 📊 統計面板（總計 / 已讀 / 進行中 / 待讀數量）
- 🔃 欄位排序（書名、作者、類別、狀態、評分）
- 💾 資料持久化至 MySQL 資料庫

## 📁 專案結構

```
Reading-List-Vue/
├── vue-project/      # 前端（Vue 3 + Vite）
│   └── src/
│       ├── App.vue   # 主元件
│       └── components/
└── server/           # 後端（Node.js + Express）
    ├── index.js      # API 伺服器
    └── .env          # 環境變數（不納入版控）
```

## 🚀 本機執行

### 前置需求
- Node.js
- MySQL

### 資料庫設定

```sql
CREATE DATABASE reading_list;
USE reading_list;

CREATE TABLE books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  genre VARCHAR(100),
  status VARCHAR(20),
  rate INT DEFAULT 0
);
```

### 後端設定

```bash
cd server
npm install
```

建立 `.env` 檔案：
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的密碼
DB_NAME=reading_list
```

啟動後端：
```bash
node index.js
```

### 前端設定

```bash
cd vue-project
npm install
npm run dev
```

開啟瀏覽器前往 `http://localhost:5173`

## 🔌 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/books` | 取得所有書籍 |
| POST | `/api/books` | 新增書籍 |
| PUT | `/api/books/:id` | 更新書籍 |
| DELETE | `/api/books/:id` | 刪除書籍 |

## 📝 開發歷程

此專案原為原生 JavaScript 版本，後以 Vue 3 重構並加入後端與資料庫：

- 原生 JS 版 → [Reading-List](https://github.com/Xnerv15step/Reading-List)
- Vue 重構版 → 本專案
