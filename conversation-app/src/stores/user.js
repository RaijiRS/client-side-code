import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { findUser, db, createUser } from '@/data/db'

export const useUserStore = defineStore('userStore', () => {
  const storedUsername = localStorage.getItem('username')
  const storedUser = storedUsername
    ? (db.users.find((u) => u.username === storedUsername) ?? null)
    : null

  const user = ref(storedUser)

  function login(username, password) {
    const found = findUser(username, password)
    if (!found) throw new Error('Invalid credentials')
    localStorage.setItem('username', found.username)
    user.value = found
    return found
  }

  function register(username, password) {
    const newUser = createUser(username, password)
    localStorage.setItem('username', newUser.username)
    user.value = newUser
    return newUser
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

  return { user, login, register, logout, refresh, isLoggedIn }
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
