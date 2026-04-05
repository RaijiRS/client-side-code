<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const store = useUserStore()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

const usernameState = computed(() => {
  const value = username.value
  return {
    minLength: value.length >= 5,
    startsWithLetter: /^[A-Za-z]/.test(value),
    lettersAndNumbers: value === '' ? false : /^[A-Za-z][A-Za-z0-9]*$/.test(value),
    maxLengthOk: value.length <= 16,
  }
})

const passwordState = computed(() => {
  const value = password.value
  return {
    minLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[^A-Za-z0-9]/.test(value),
    maxLengthOk: value.length <= 64,
  }
})

const emailError = computed(() => {
  const val = email.value.trim()
  if (!val) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Must include @ and a domain'
  return ''
})

const isFirstNameValid = computed(() => firstName.value.trim().length > 0)
const isLastNameValid = computed(() => lastName.value.trim().length > 0)
const isUsernameValid = computed(() => Object.values(usernameState.value).every(Boolean))
const isPasswordValid = computed(() => Object.values(passwordState.value).every(Boolean))
const isEmailValid = computed(() => !emailError.value)
const allValid = computed(
  () =>
    isUsernameValid.value &&
    isPasswordValid.value &&
    isEmailValid.value &&
    isFirstNameValid.value &&
    isLastNameValid.value,
)

async function handleCreate() {
  if (!allValid.value) return
  error.value = ''
  try {
    await store.register(
      username.value,
      password.value,
      firstName.value,
      lastName.value,
      email.value,
    )
    store.isNewUser = true
    router.push('/signin')
  } catch (e) {
    error.value = e.message || 'Could not create account.'
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="card-header">
        <span class="eyebrow">MIDNIGHT CLUB</span>
        <h1>Create Account</h1>
        <p>{{ store.user ? 'Register a new identity' : 'Join the club' }}</p>
      </div>

      <div class="fields">
        <div class="field">
          <label for="usernameInput">Username*</label>
          <input
            id="usernameInput"
            v-model="username"
            autocomplete="off"
            placeholder="your_handle"
          />
        </div>
        <div class="field">
          <label for="firstNameInput">First Name*</label>
          <input
            id="firstNameInput"
            v-model="firstName"
            autocomplete="off"
            placeholder="First Name"
          />
        </div>
        <div class="field">
          <label for="lastNameInput">Last Name*</label>
          <input id="lastNameInput" v-model="lastName" autocomplete="off" placeholder="Last Name" />
        </div>
        <div class="field">
          <label for="emailInput">Email*</label>
          <input id="emailInput" v-model="email" autocomplete="off" placeholder="you@example.com" />
          <!-- Inline hint shown only when there's a problem -->
          <span class="field-hint unmet" v-if="email.length > 0 && !isEmailValid">
            {{ emailError }}
          </span>
        </div>
        <div class="field">
          <label for="passwordInput">Password*</label>
          <div class="input-row">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="passwordInput"
              v-model="password"
              @keyup.enter="handleCreate"
              placeholder="••••••••"
            />
            <button class="show-btn" @click="showPassword = !showPassword" type="button">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>
      </div>

      <div class="requirements" v-if="username.length > 0 || password.length > 0">
        <div class="req-group" v-if="username.length > 0">
          <div class="req-label">Username</div>
          <div class="req-list">
            <span :class="['req', usernameState.minLength ? 'met' : 'unmet']">5+ chars</span>
            <span :class="['req', usernameState.startsWithLetter ? 'met' : 'unmet']"
              >Starts with letter</span
            >
            <span :class="['req', usernameState.lettersAndNumbers ? 'met' : 'unmet']"
              >Letters & numbers only</span
            >
            <span :class="['req', usernameState.maxLengthOk ? 'met' : 'unmet']">Max 16</span>
          </div>
        </div>
        <div class="req-group" v-if="password.length > 0">
          <div class="req-label">Password</div>
          <div class="req-list">
            <span :class="['req', passwordState.minLength ? 'met' : 'unmet']">8+ chars</span>
            <span :class="['req', passwordState.hasUppercase ? 'met' : 'unmet']">Uppercase</span>
            <span :class="['req', passwordState.hasLowercase ? 'met' : 'unmet']">Lowercase</span>
            <span :class="['req', passwordState.hasNumber ? 'met' : 'unmet']">Number</span>
            <span :class="['req', passwordState.hasSpecial ? 'met' : 'unmet']">Special char</span>
          </div>
        </div>
      </div>

      <div class="error-msg" v-if="error"><span class="error-dot"></span>{{ error }}</div>

      <button class="submit" @click="handleCreate" :disabled="!allValid">Create Account</button>

      <div class="footer">
        <span>Already have an account?</span>
        <router-link to="/signin">Sign in</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800&family=Share+Tech+Mono&display=swap');

.page {
  min-height: 97vh;
  width: 99vw;
  overflow: hidden;
  position: fixed;
  background: #090c10;
  display: flex;
  align-items: center;
  justify-content: center;

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

.field-hint {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  padding: 3px 0;
}

.field-hint.unmet {
  color: #ff3355;
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

.requirements {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #1c2730;
  padding-top: 16px;
}

.req-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #2a3f52;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.req-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.req {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 2px;
  transition: all 0.2s;
}

.req.unmet {
  background: #1a0a0e;
  color: #ff3355;
  border: 1px solid #3a1520;
}
.req.met {
  background: #001a20;
  color: #00d4ff;
  border: 1px solid #004455;
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
