import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('userStore', () => {
  

  const isNewUser = ref(false)
    const user = ref(localStorage.getItem('authToken') ? {
  username: localStorage.getItem('username'),
  authToken: localStorage.getItem('authToken'),
} : null)
  const host = 'https://stingray-app-u3bsh.ondigitalocean.app'

async function register(username, password, firstName, lastName, email) {
  const response = await fetch(host + '/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, firstName, lastName, email }),
  })
  if (!response.ok) {
    const result = await response.json()
    throw new Error(result.errors ? Object.values(result.errors)[0].message : 'Could not create account')
  }
}

async function login(username, password) {
  const response = await fetch(host + '/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) throw new Error('Invalid credentials')
  const result = await response.json()
  localStorage.setItem('username', result.user.username)
  localStorage.setItem('authToken', result.authToken)
  user.value = result.user
}

  function logout() {
    localStorage.removeItem('username')
    user.value = null
  }

  const isLoggedIn = computed(() => user.value !== null)

  function refresh() {
    if (!user.value) return
    const fresh = db.users.find((u) => u.id === user.value.id)
    if (fresh) user.value = { ...fresh }
  }

  return { user, login, register, logout, refresh, isLoggedIn,isNewUser }
})

const usernameRules = [
  { test: (val) => val.length >= 5, message: 'Must have at least 5 characters' },
  { test: (val) => val.length <= 16, message: 'Cannot have more than 16 characters' },
  { test: (val) => /^[a-zA-Z]/.test(val), message: 'Must begin with a letter' },
  { test: (val) => /^[a-zA-Z0-9]+$/.test(val), message: 'Can only contain letters and numbers' },
]

export function validateUsername(name) {
  const errors = []
  for (const rule of usernameRules) {
    if (!rule.test(name)) errors.push(rule.message)
  }
  return errors
}

const passwordRules = [
  { test: (val) => val.length >= 8, message: 'Must have at least 8 characters' },
  { test: (val) => val.length <= 64, message: 'Cannot have more than 64 characters' },
  { test: (val) => /[A-Z]/.test(val), message: 'Must have 1 uppercase character' },
  { test: (val) => /[a-z]/.test(val), message: 'Must have 1 lowercase character' },
  { test: (val) => /[0-9]/.test(val), message: 'Must have 1 number' },
  { test: (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), message: 'Must have 1 special character' },
]

export function validatePassword(pass) {
  const errors = []
  const trimmed = pass?.trim() || ''
  for (const rule of passwordRules) {
    if (!rule.test(trimmed)) errors.push(rule.message)
  }
  return errors
}

const emailRules = [
  {
    test: (val) => !!val,
    message: 'Email is required',
  },
  {
    test: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    message: 'Invalid email format',
  },
]

export function validateEmail(email) {
  const errors = []
  const trimmed = email?.trim() || ''

  for (const rule of emailRules) {
    if (!rule.test(trimmed)) errors.push(rule.message)
  }

  return errors
}