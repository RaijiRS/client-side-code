<script setup>
import { useMessageStore } from '@/stores/messageStore.js'
import { useUserStore } from '@/stores/userStore.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const messageStore = useMessageStore()
const userStore = useUserStore()

const handleLogin = (user) => {
  userStore.login(user)
  router.push('/chat')
}
</script>

<template>
  <div class="layout login-view">
    <header class="chat-header">
      <h1 class="logo">MySpace Messenger</h1>
      <span class="status">Status: {{ userStore.currentUser?.username || 'Logged Out' }}</span>
    </header>

    <div class="login-container">
      <h2>Select a Profile to Login</h2>

      <div class="user-grid">
        <div
          v-for="user in messageStore.Users"
          :key="user.username"
          class="user-card"
          @click="handleLogin(user)"
        >
          <div class="avatar-placeholder">No Image</div>
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <span class="name">{{ user.firstName }} {{ user.lastName }}</span>
            <span class="followers"
              >Followers: {{ user.username.trim() === 'Roxy' ? '5M' : '126' }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  background-color: #003399;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
}

.login-container {
  background: white;
  border: 2px solid #000;
  padding: 20px;
  margin: 0 auto;
  max-width: 600px;
}

h2 {
  color: #ff6600;
  border-bottom: 2px solid #6699ff;
  padding-bottom: 5px;
  margin-top: 0;
}

.user-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background-color: #d5e4ff;
  border: 1px solid #6699ff;
  cursor: pointer;
  transition: background 0.2s;
}

.user-card:hover {
  background-color: #ffe5d5; /* Orange highlight on hover */
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  background: #6699ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  border: 1px solid #000;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.username {
  font-weight: bold;
  color: #003399;
  text-decoration: underline;
}

.name {
  font-size: 0.9rem;
}

.followers {
  font-size: 0.75rem;
  color: #666;
  margin-top: 4px;
}

.view-btn {
  background: white;
  border: 1px solid #000;
  padding: 5px 10px;
  font-weight: bold;
  cursor: pointer;
}

.logo {
  font-size: 1.5rem;
  margin: 0;
}
.status {
  font-size: 0.8rem;
}
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  background-color: #6699ff;
  padding: 12px 20px;

  position: sticky;
  top: 0;
  z-index: 1000;

  border: 2px solid #ffffff;
  box-shadow: 0 4px 0px rgba(0, 0, 0, 0.2);

  margin: 20px 10px 10px 10px;

  color: #ffffff;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.chat-header span {
  font-size: 0.9rem;
  text-shadow: 1px 1px 0px #003399;
}
</style>
