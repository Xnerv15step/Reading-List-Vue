// ============================================================
// db.js
// 資料庫連線設定
// 建立 MySQL 連線並匯出，讓其他模組（Controller）可以使用
// ============================================================

const mysql  = require('mysql2')
require('dotenv').config()  // 載入 .env 檔案的環境變數

// 建立 MySQL 連線
// 敏感資訊從 .env 讀取，不寫死在程式碼裡，避免上傳到 GitHub
const db = mysql.createConnection({
  host:     process.env.DB_HOST,      // 資料庫主機（通常是 localhost）
  user:     process.env.DB_USER,      // 資料庫帳號
  password: process.env.DB_PASSWORD,  // 資料庫密碼
  database: process.env.DB_NAME       // 要使用的資料庫名稱（reading_list）
}).promise()
// .promise() 讓 db.query() 回傳 Promise
// 這樣才能在 Controller 裡用 async/await 寫法

// 匯出連線物件，讓 controllers 可以 require('./db') 來使用
module.exports = db