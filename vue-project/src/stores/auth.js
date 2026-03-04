// ============================================================
// stores/auth.js
// 用 Pinia 管理登入狀態和 Token
// ============================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {

  // Token 狀態，預設從 localStorage 讀取（重新整理後不會消失）
  const token = ref(localStorage.getItem('token') || '')

  // ============================================================
  // 登入
  // 呼叫後端登入 API，成功後儲存 Token
  // ============================================================
  async function login(account, password) {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      account,
      password
    })

    // 把 Token 存到 Pinia 狀態和 localStorage
    token.value = res.data.token
    localStorage.setItem('token', res.data.token)

    // 登入成功後跳轉到書單頁
    router.push('/')
  }

  // ============================================================
  // 登出
  // 清除 Token，跳回登入頁
  // ============================================================
  function logout() {
    token.value = ''
    localStorage.removeItem('token')
    router.push('/login')
  }

  // ============================================================
  // 是否已登入（Token 存在即視為已登入）
  // ============================================================
  const isLoggedIn = () => !!token.value

  return { token, login, logout, isLoggedIn }
})