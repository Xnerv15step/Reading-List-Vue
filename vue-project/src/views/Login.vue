<script setup>
// ============================================================
// Login.vue
// 登入頁面
// 負責收集帳號密碼，呼叫 Pinia auth store 的 login 函式
// ============================================================

import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

// 取得 auth store（包含 login / logout / token）
const auth = useAuthStore()

// 表單欄位
const account  = ref('')  // 帳號輸入值
const password = ref('')  // 密碼輸入值
const error    = ref('')  // 錯誤訊息（登入失敗時顯示）

// ============================================================
// 送出登入
// 呼叫 auth.login()，成功後 store 內部會自動跳轉到書單頁
// 失敗時顯示錯誤訊息
// ============================================================
async function handleLogin() {
  error.value = ''  // 每次送出前先清空舊的錯誤訊息
  try {
    await auth.login(account.value, password.value)
  } catch (err) {
    // 後端回傳錯誤（帳號不存在或密碼錯誤）時顯示提示
    error.value = '帳號或密碼錯誤，請再試一次'
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">

      <!-- 標題 -->
      <h1>閱讀 <span>清單</span></h1>
      <p class="subtitle">請登入以繼續</p>

      <!-- 錯誤訊息（登入失敗時才顯示） -->
      <div v-if="error" class="error-msg">{{ error }}</div>

      <!-- 帳號輸入 -->
      <div class="form-group">
        <label>帳號</label>
        <input v-model="account" type="text" placeholder="請輸入帳號" />
      </div>

      <!-- 密碼輸入（按 Enter 也可以觸發登入） -->
      <div class="form-group">
        <label>密碼</label>
        <input v-model="password" type="password" placeholder="請輸入密碼" @keyup.enter="handleLogin" />
      </div>

      <!-- 登入按鈕 -->
      <button class="btn-login" @click="handleLogin">登入</button>

    </div>
  </div>
</template>