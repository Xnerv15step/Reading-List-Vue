import { createRouter, createWebHistory } from 'vue-router'

// ============================================================
// 路由設定
// ============================================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/Books.vue'), 
      // 書單頁（需登入）
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
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')

  // 1. 如果要去需要登入的頁面，但沒有 Token
  if (to.meta.requiresAuth && !token) {
    return { path: '/login' } // 直接 return 路徑，不要用 next()
  }

  // 2. 如果已登入卻要去登入頁
  if (to.path === '/login' && token) {
    return { path: '/' }
  }

  // 3. 其他情況不回傳 (或回傳 true) 即代表放行
  return true
})


export default router