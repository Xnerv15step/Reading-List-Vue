// ============================================================
// middleware/auth.js
// 驗證 JWT Token 的 middleware
// 保護需要登入才能使用的 API
// ============================================================

const jwt = require('jsonwebtoken')

// 和 authController.js 裡的 SECRET 要一樣
const SECRET = 'my_secret_key'

function authMiddleware(req, res, next) {
  // 1. 從 Header 取得 Token
  // 前端會在 Header 加上：Authorization: Bearer <token>
  const authHeader = req.headers.authorization

  // 沒有帶 Token，擋下來
  if (!authHeader) {
    return res.status(401).json({ error: '請先登入' })
  }

  // 2. 把 "Bearer <token>" 拆開，取得 token 的部分
  const token = authHeader.split(' ')[1]

  try {
    // 3. 驗證 Token 是否有效
    // jwt.verify 會解碼 Token，回傳存入的資料
    const decoded = jwt.verify(token, SECRET)

    // 4. 把使用者資訊存進 req，讓後面的路由可以使用
    req.user = decoded

    // 5. 驗證通過，繼續往下
    next()

  } catch (err) {
    // Token 無效或過期
    return res.status(401).json({ error: 'Token 無效或已過期' })
  }
}

module.exports = authMiddleware