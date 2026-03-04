import { createRouter, createWebHistory } from 'vue-router'

// ============================================================
// 路由設定
// ============================================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/Books.vue'), // 書單頁（需登入）
      meta: { requiresAuth: true }                   // 標記此頁需要登入
    },
    {
      path: '/login',
      component: () => import('../views/Login.vue'), // 登入頁
    }
  ],
})

// ============================================================
// 路由守衛（Navigation Guard）
// 每次切換頁面前都會執行
// ============================================================
router.beforeEach((to, from, next) => {
  // 從 localStorage 取得 Token
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // 要去需要登入的頁面，但沒有 Token → 跳回登入頁
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登入卻要去登入頁 → 跳回書單頁（避免重複登入）
    next('/')
  } else {
    // 其他情況正常放行
    next()
  }
})

export default router