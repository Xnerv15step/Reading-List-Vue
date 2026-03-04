<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const account  = ref('')
const password = ref('')
const error    = ref('')

async function handleLogin() {
  error.value = ''
  try {
    await auth.login(account.value, password.value)
  } catch (err) {
    error.value = '帳號或密碼錯誤，請再試一次'
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <h1>閱讀 <span>清單</span></h1>
      <p class="subtitle">請登入以繼續</p>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="form-group">
        <label>帳號</label>
        <input v-model="account" type="text" placeholder="請輸入帳號" />
      </div>

      <div class="form-group">
        <label>密碼</label>
        <input v-model="password" type="password" placeholder="請輸入密碼" @keyup.enter="handleLogin" />
      </div>

      <button class="btn-login" @click="handleLogin">登入</button>
    </div>
  </div>
</template>

