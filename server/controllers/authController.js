// ============================================================
// authController.js
// 負責處理登入驗證邏輯
// ============================================================

const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const db     = require('../db')

// JWT 的加密金鑰，用來簽名和驗證 Token
// 實際專案應放在 .env 裡，這裡先寫死方便練習
const SECRET = 'my_secret_key'


// ============================================================
// 登入
// POST /api/auth/login
// 前端傳入 { account, password }
// ============================================================
async function login(req, res) {
  const { account, password } = req.body

  try {
    // 1. 用帳號查詢資料庫，看使用者是否存在
    const [rows] = await db.query(
      'SELECT * FROM users WHERE account = ?',
      [account]
    )

    // 如果查不到使用者，回傳 401
    const user = rows[0]
    if (!user) {
      return res.status(401).json({ error: '帳號不存在' })
    }

    // 2. 用 bcrypt 比對密碼
    // bcrypt.compare 會把輸入的密碼和資料庫的雜湊密碼比對
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: '密碼錯誤' })
    }

    // 3. 驗證通過，產生 JWT Token
    // jwt.sign(存入Token的資料, 金鑰, 設定)
    const token = jwt.sign(
      { id: user.id, account: user.account }, // 存入 Token 的資料
      SECRET,                                  // 加密金鑰
      { expiresIn: '1d' }                      // Token 有效期限 1 天
    )

    // 4. 把 Token 回傳給前端
    res.json({ token })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { login }