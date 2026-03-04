// ============================================================
// bookController.js
// 負責處理所有書單相關的業務邏輯
// 每個函式對應一個 API 操作，由路由呼叫
// ============================================================

// 載入資料庫連線（從 db.js 匯入）
const db = require('../db')


// ============================================================
// 查詢全部書籍
// GET /api/books
// ============================================================
async function getBooks(req, res) {
  try {
    // 查詢 books 資料表的所有資料
    // db.query 回傳陣列 [results, fields]，我們只需要 results
    const [results] = await db.query('SELECT * FROM books')

    // 把結果以 JSON 格式回傳給前端
    res.json(results)
  } catch (err) {
    // 查詢失敗時回傳 500 錯誤和錯誤訊息
    res.status(500).json({ error: err.message })
  }
}


// ============================================================
// 新增一本書籍
// POST /api/books
// 前端從 req.body 傳入書籍資料
// ============================================================
async function createBook(req, res) {
  // 從前端傳來的 body 解構出需要的欄位
  const { title, author, genre, status, rate } = req.body

  try {
    // 用 ? 佔位符插入資料，防止 SQL Injection
    const [result] = await db.query(
      'INSERT INTO books (title, author, genre, status, rate) VALUES (?, ?, ?, ?, ?)',
      [title, author, genre, status, rate]
    )

    // 回傳新增的書籍資料
    // result.insertId 是資料庫自動產生的新 id
    res.json({ id: result.insertId, title, author, genre, status, rate })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// ============================================================
// 修改指定書籍
// PUT /api/books/:id
// :id 從 req.params.id 取得（網址上的動態參數）
// ============================================================
async function updateBook(req, res) {
  // 從 body 取得要更新的欄位
  const { title, author, genre, status, rate } = req.body

  try {
    // 更新指定 id 的書籍資料
    // WHERE id=? 確保只更新這一筆
    await db.query(
      'UPDATE books SET title=?, author=?, genre=?, status=?, rate=? WHERE id=?',
      [title, author, genre, status, rate, req.params.id]
    )

    res.json({ message: '更新成功' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// ============================================================
// 刪除指定書籍
// DELETE /api/books/:id
// ============================================================
async function deleteBook(req, res) {
  try {
    // 刪除指定 id 的書籍
    await db.query('DELETE FROM books WHERE id=?', [req.params.id])

    res.json({ message: '刪除成功' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// ============================================================
// 匯出所有函式，讓路由檔案可以使用
// ============================================================
module.exports = { getBooks, createBook, updateBook, deleteBook }