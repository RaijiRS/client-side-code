import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('userStore', () => {
  const currentUser = ref(JSON.parse(localStorage.getItem('activeUser')) || null)

  function login(user) {
    currentUser.value = user
    localStorage.setItem('activeUser', JSON.stringify(user))
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('activeUser')
  }

  return { currentUser, login, logout }
})
