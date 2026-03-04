// ============================================================
// routes/books.js
// 負責定義所有書單相關的路由
// 只做路由對應，實際邏輯交給 Controller 處理
// ============================================================

const express = require('express')

// express.Router() 是 Express 提供的迷你路由器
// 可以把路由拆成獨立模組，再掛到主程式上
const router = express.Router()

// 載入 Controller，取得四個處理函式
const { getBooks, createBook, updateBook, deleteBook } = require('../controllers/bookController')


// ============================================================
// 路由對應
// 網址已經在 index.js 加上 /api/books 前綴
// 所以這裡只需要寫 / 和 /:id
// ============================================================

router.get('/',     getBooks)     // GET    /api/books
router.post('/',    createBook)   // POST   /api/books
router.put('/:id',  updateBook)   // PUT    /api/books/:id
router.delete('/:id', deleteBook) // DELETE /api/books/:id


// 匯出路由，讓 index.js 可以使用
module.exports = router