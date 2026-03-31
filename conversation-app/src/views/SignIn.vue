<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

const canSubmit = computed(() => username.value.length > 0 && password.value.length > 0)

async function handleSignIn() {
  if (!canSubmit.value) return
  error.value = ''
  try {
    await store.login(username.value, password.value)
    store.isNewUser = false
    const redirect = route.query.redirect || `/${username.value}/messages`
    router.push(redirect)
  } catch {
    error.value = 'Invalid username or password.'
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="card-header">
        <span class="eyebrow">MIDNIGHT CLUB</span>
        <h1>Sign In</h1>
        <p>{{ store.isNewUser ? `Account Created Please Sign In` : 'Welcome' }}</p>
      </div>

      <div class="fields">
        <div class="field">
          <label for="usernameInput">Username</label>
          <input
            id="usernameInput"
            v-model="username"
            autocomplete="username"
            placeholder="your_handle"
            @keyup.enter="handleSignIn"
          />
        </div>

        <div class="field">
          <label for="passwordInput">Password</label>
          <div class="input-row">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="passwordInput"
              v-model="password"
              autocomplete="current-password"
              placeholder="••••••••"
              @keyup.enter="handleSignIn"
            />
            <button class="show-btn" @click="showPassword = !showPassword" type="button">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>
      </div>

      <div class="error-msg" v-if="error"><span class="error-dot"></span>{{ error }}</div>

      <button class="submit" @click="handleSignIn" :disabled="!canSubmit">Sign In</button>

      <div class="footer">
        <span>No account?</span>
        <router-link to="/create">Create one</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800&family=Share+Tech+Mono&display=swap');

.page {
  min-height: 100vh;
  background: #090c10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  font-family: 'Barlow Condensed', sans-serif;
}

.card {
  background: #0e1318;
  border: 1px solid #1c2730;
  border-top: 3px solid #00d4ff;
  width: 100%;
  max-width: 360px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #00d4ff;
  opacity: 0.6;
}

.card-header h1 {
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  color: #e8f0f5;
  letter-spacing: 0.02em;
  line-height: 1;
}

.card-header p {
  margin: 0;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: #354a58;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #354a58;
  text-transform: uppercase;
}

.field input,
.input-row input {
  background: #080b0e;
  border: 1px solid #1c2730;
  border-radius: 3px;
  color: #c8dae6;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  padding: 10px 12px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.field input:focus,
.input-row input:focus {
  border-color: #00d4ff55;
}

.input-row {
  position: relative;
  display: flex;
  align-items: center;
}
.input-row input {
  padding-right: 52px;
}

.show-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #2a3f52;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}
.show-btn:hover {
  color: #00d4ff;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: #ff3355;
  background: #1a0a0e;
  border: 1px solid #3a1520;
  border-radius: 3px;
  padding: 8px 12px;
}

.error-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ff3355;
  flex-shrink: 0;
  box-shadow: 0 0 6px #ff335588;
}

.submit {
  width: 100%;
  padding: 12px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 3px;
  border: 1px solid #1c2730;
  background: #0e1318;
  color: #2a3f52;
  cursor: not-allowed;
  transition: all 0.25s;
}

.submit:not(:disabled) {
  background: #00d4ff;
  border-color: #00d4ff;
  color: #040608;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
}

.submit:not(:disabled):hover {
  box-shadow: 0 0 32px rgba(0, 212, 255, 0.35);
  transform: translateY(-1px);
}

.submit:not(:disabled):active {
  transform: scale(0.98);
}

.footer {
  display: flex;
  justify-content: center;
  gap: 6px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: #2a3f52;
  border-top: 1px solid #1c2730;
  padding-top: 16px;
  margin-top: -8px;
}

.footer a {
  color: #00d4ff;
  text-decoration: none;
  transition: opacity 0.2s;
}
.footer a:hover {
  opacity: 0.7;
}
</style>
