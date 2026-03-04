// ============================================================
// routes/auth.js
// 負責定義所有驗證相關的路由
// ============================================================

const express = require('express')
const router  = express.Router()

// 載入 Controller
const { login } = require('../controllers/authController')

// POST /api/auth/login → 登入
router.post('/login', login)

module.exports = router