<script setup>
import { ref, nextTick, useTemplateRef, watch, onMounted } from 'vue'
import Message from '@/models/Message'
import { useMessageStore } from '@/stores/messageStore'
import { useUserStore } from '@/stores/userStore'
import { useRouter } from 'vue-router'

const messageStore = useMessageStore()
const userStore = useUserStore()
const router = useRouter()

const chatbox = useTemplateRef('chatbox')
const newMessage = ref('')

onMounted(async () => {
  await nextTick()

  if (chatbox.value) {
    chatbox.value.scrollTop = chatbox.value.scrollHeight
  }
})

watch(
  () => messageStore.messageData.length,
  async () => {
    await nextTick()

    if (chatbox.value) {
      chatbox.value.scrollTop = chatbox.value.scrollHeight
    }
  },
  { deep: true },
)

const send = () => {
  if (!newMessage.value.trim()) return

  const post = new Message(
    userStore.currentUser.username,
    userStore.currentUser.firstName,
    userStore.currentUser.lastName,
    newMessage.value,
  )

  messageStore.add(post)
  newMessage.value = ''
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="layout">
    <div class="chat-header">
      <span>Logged in as: {{ userStore.currentUser.firstName }}</span>
      <br />
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>

    <div class="chatbox" ref="chatbox">
      <div
        v-for="(message, index) in messageStore.messageData"
        :key="index"
        :class="[
          'message-row',
          message.username.trim() === userStore.currentUser.username.trim() ? 'sent' : 'received',
        ]"
      >
        <span class="display-name">{{ message.username }}</span>
        <div class="bubbleWrapper">
          <div class="bubble">{{ message.message.trim() }}</div>
          <button
            v-if="message.username.trim() === userStore.currentUser.username.trim()"
            @click="messageStore.toggleRedact(index)"
            class="redact-btn"
          >
            {{ message.isRedacted ? 'Show' : 'X' }}
          </button>
        </div>
      </div>
    </div>
    <div class="inputWrapper">
      <input v-model="newMessage" @keyup.enter="send" placeholder="Message..." />
      <button @click="send">Send</button>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #003399;
  font-family: Arial, Helvetica, sans-serif;
  padding: 10px;
  width: 97%;
  height: 500px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #6699ff;
  border: 2px solid #ffffff;
  margin: 10px;
  color: #ffffff;
  font-weight: bold;
}

.logout-btn {
  background-color: #ffffff;
  color: #003399;
  border: 1px solid #000000;
  padding: 4px 8px;
  font-size: 0.8rem;
  text-transform: uppercase;
  cursor: pointer;
}

.chatbox {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #ffffff;
  border: 2px solid #000000;
  margin: 0 10px;
}

.message-row {
  display: flex;
  flex-direction: column;
  max-width: 90%;
  padding: 8px;
  border: 1px solid #6699ff;
  background-color: #d5e4ff;
}

.sent {
  align-self: flex-end;
  border-color: #ff6600;
  background-color: #ffe5d5;
}

.display-name {
  font-weight: bold;
  color: #003399;
  text-decoration: underline;
  margin-bottom: 5px;
}

.bubble {
  padding: 5px;
  border-radius: 0;
  color: #000000;
  font-size: 14px;
}

.redact-btn {
  margin-top: 5px;
  color: #666;
  text-decoration: underline;
  font-size: 0.7rem;
}

.inputWrapper {
  padding: 5px;
  background: #6699ff;
  display: flex;
  gap: 5px;
}

input {
  flex: 1;
  padding: 8px;
  border: 1px solid #000;
  border-radius: 0; /* Boxy look */
}

.inputWrapper button {
  background: #ffffff;
  border: 1px solid #000;
  font-weight: bold;
  padding: 0 15px;
}
</style>
