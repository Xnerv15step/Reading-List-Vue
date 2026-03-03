// ============================================================
// 載入套件
// express  → 建立後端伺服器與路由
// mysql2   → 連接 MySQL 資料庫
// cors     → 允許前端（不同 port）存取此 API
// dotenv   → 從 .env 檔案載入環境變數（如密碼）
// ============================================================
const express = require('express')
const mysql   = require('mysql2')
const cors    = require('cors')
require('dotenv').config()

const app = express()

// 允許跨來源請求（前端 port 5173 呼叫後端 port 3000 時需要）
app.use(cors())

// 解析 JSON 格式的請求 body（POST / PUT 時前端傳來的資料）
app.use(express.json())


// ============================================================
// 建立 MySQL 連線
// 敏感資訊（帳號、密碼）從 .env 讀取，不寫死在程式碼裡
// ============================================================
const db = mysql.createConnection({
  host:     process.env.DB_HOST,      // 資料庫主機（通常是 localhost）
  user:     process.env.DB_USER,      // 資料庫帳號
  password: process.env.DB_PASSWORD,  // 資料庫密碼
  database: process.env.DB_NAME       // 要使用的資料庫名稱
})

// 嘗試連線，成功或失敗都印出訊息
db.connect(err => {
  if (err) {
    console.error('資料庫連線失敗：', err)
    return
  }
  console.log('資料庫連線成功！')
})


// ============================================================
// API 路由
// RESTful 設計：用 HTTP 方法區分操作類型
//   GET    → 查詢
//   POST   → 新增
//   PUT    → 更新
//   DELETE → 刪除
// ============================================================

// GET /api/books
// 取得所有書籍，回傳陣列給前端
app.get('/api/books', (req, res) => {
  db.query('SELECT * FROM books', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)  // 回傳查詢結果（書籍陣列）
  })
})

// POST /api/books
// 新增一本書籍，從 req.body 取得前端傳來的資料
// 使用 ? 佔位符防止 SQL Injection
app.post('/api/books', (req, res) => {
  const { title, author, genre, status, rate } = req.body
  db.query(
    'INSERT INTO books (title, author, genre, status, rate) VALUES (?, ?, ?, ?, ?)',
    [title, author, genre, status, rate],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message })
      // 回傳新增的書籍資料，包含資料庫自動產生的 id
      res.json({ id: results.insertId, title, author, genre, status, rate })
    }
  )
})

// PUT /api/books/:id
// 更新指定 id 的書籍，:id 是 URL 參數，由 req.params.id 取得
app.put('/api/books/:id', (req, res) => {
  const { title, author, genre, status, rate } = req.body
  db.query(
    'UPDATE books SET title=?, author=?, genre=?, status=?, rate=? WHERE id=?',
    [title, author, genre, status, rate, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ message: '更新成功' })
    }
  )
})

// DELETE /api/books/:id
// 刪除指定 id 的書籍
app.delete('/api/books/:id', (req, res) => {
  db.query('DELETE FROM books WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: '刪除成功' })
  })
})


// ============================================================
// 啟動伺服器
// 監聽 port 3000，前端透過 http://localhost:3000 呼叫 API
// ============================================================
app.listen(3000, () => {
  console.log('後端伺服器跑在 http://localhost:3000')
})