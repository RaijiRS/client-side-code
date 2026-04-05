<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import {
  db,
  findUserById,
  getMessages,
  sendMessage,
  acceptRequest,
  declineRequest,
} from '@/data/db'

const router = useRouter()
const route = useRoute()
const store = useUserStore()
const { refresh } = store

if (!store.user) router.push('/signin')

const { friends, incoming, outgoing } = storeToRefs(store)
const me = computed(() => store.user)

const activeFriend = ref(null)

async function resolveFromRoute() {
  const param = route.params.friendUsername

  if (!param) {
    activeFriend.value = null
    return
  }

  const result = await store.getUsers(1, 0, param)
  if (result && Array.isArray(result) && result.length > 0) {
    const match = result.find((u) => u.username.toLowerCase() === param.toLowerCase())
    activeFriend.value = match || null
  } else {
    activeFriend.value = null
  }
}

resolveFromRoute()
watch(() => route.params.friendUsername, resolveFromRoute)

const activeTab = ref('friends')

async function loadData() {
  try {
    await store.fetchRelationships()
    const profile = await store.getProfile()
    console.log(profile)
  } catch (err) {
    console.log(err)
  }
}
loadData()


async function accept(fromId) {
  try {
    await store.acceptRequest(fromId)
    await loadData()
  } catch (err) {
    console.error('Accept failed:', err)
  }
}

async function decline(fromId) {
  try {
    await store.declineRequest(fromId)
    await loadData()
  } catch (err) {
    console.error('Decline failed:', err)
  }
}




async function sendFriendRequest(targetUser) {
  if (!me.value) return

  
   const alreadySent = outgoing.value.some((req) => String(req.userId) === targetUser._id)
   
   console.log(targetUser._id)
  if (alreadySent) return
  try {
    const targetId = targetUser._id || targetUser.id
    console.log(targetId)
    await store.sendRequest(targetId,targetUser.username)

    searchQuery.value = ''
    searchResults.value = []
    await loadData()
  } catch (err) {
    console.error('Send request failed:', err)
  }
}

function openChat(friend) {
  activeFriend.value = friend
  router.push(`/${me.value.username}/messages/${friend.username}`)
}

const messageList = ref([])

function loadMessages() {
  if (!activeFriend.value || !me.value) {
    messageList.value = []
    return
  }
  messageList.value = getMessages(me.value.id, activeFriend.value.id)
}

watch(activeFriend, loadMessages, { immediate: true })

const newMessage = ref('')
const messagesEl = ref(null)

function handleSend() {
  const text = newMessage.value.trim()
  if (!text || !activeFriend.value) return
  const msg = sendMessage(me.value.id, activeFriend.value.id, text)
  messageList.value.push(msg)
  newMessage.value = ''
  nextTick(scrollToBottom)
}

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

watch(messageList, () => nextTick(scrollToBottom), { flush: 'post' })

const searchQuery = ref('')
const searchError = ref('')
const searchResults = ref([])
const isSearching = ref(false)

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const confirmingLogout = ref(false)

function logout() {
  store.logout()
  router.push('/signin')
}

async function runSearch(query) {
  const q = query.trim()
  if (!q) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const data = await store.getUsers(10, 0, q)

    if (data && Array.isArray(data.users)) {
      searchResults.value = data.users.filter((u) => {
        const isMe = u.username.toLowerCase() === me.value?.username?.toLowerCase()

        const targetId = String(u._id || u.id)
        const isFriend = me.value?.friends?.some((fId) => String(fId) === targetId)

        return !isMe && !isFriend
      }).map((u) => ({
  ...u,
  requestSent: outgoing.value.some((req) => String(req.userId) === String(u._id || u.id))
}))
    } else {
      searchResults.value = []
    }
  } catch (err) {
    console.error('Search error:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

let searchTimeout = null
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    runSearch(newVal)
  }, 300)
})


const confirmingRemove = ref(false)

async function removeFriend() {
  try {
    await store.removeFriend(activeFriend.value.id)
    activeFriend.value = null
    router.push(`/${me.value.username}/messages`)
    await loadData()
  } catch (err) {
    console.error('Remove failed:', err)
  }
}

</script>

<template>
  <div v-if="me" class="page">
    <aside class="left-panel">
      <div class="panel-header">
        <div class="me-badge">
          <span class="avatar">{{ me.avatar }}</span>
          <span class="me-name">{{ me.username }}</span>
        </div>
        <button class="logout-btn" v-if="!confirmingLogout" @click="confirmingLogout = true">
          Exit
        </button>
        <div class="logout-confirm" v-else>
          <span>Sure?</span>
          <button class="req-btn accept" @click="logout">✓</button>
          <button class="req-btn decline" @click="confirmingLogout = false">✕</button>
        </div>
      </div>

      <div class="tabs">
        <button
          :class="['tab', activeTab === 'friends' ? 'active' : '']"
          @click="activeTab = 'friends'"
        >
          Friends
          <span class="badge" v-if="friends?.length">{{ friends.length }}</span>
        </button>
        <button
          :class="['tab', activeTab === 'requests' ? 'active' : '']"
          @click="activeTab = 'requests'"
        >
          Requests
          <span class="badge alert" v-if="incoming?.length">{{ incoming.length }}</span>
        </button>
        <button :class="['tab', activeTab === 'add' ? 'active' : '']" @click="activeTab = 'add'">
          + Add
        </button>
      </div>

      <div class="list" v-if="activeTab === 'friends'">
        <div
          v-for="friend in friends"
          :key="friend.id"
          :class="['friend-row', activeFriend?.id === friend.id ? 'active' : '']"
          @click="openChat(friend)"
        >
          <span class="avatar sm">{{ friend.avatar }}</span>
          <span class="friend-name">{{ friend.username }}</span>
          <span class="online-dot"></span>
        </div>
        <div class="empty" v-if="friends?.length === 0">No friends yet.</div>
      </div>

      <div class="list" v-if="activeTab === 'requests'">
        <div class="req-section-label" v-if="incoming?.length">Incoming</div>
        <div class="request-row" v-for="user in incoming" :key="user.id">
          <span class="avatar sm">{{ user.avatar }}</span>
          <span class="friend-name">{{ user.username }}</span>
          <div class="req-actions">
            <button class="req-btn accept" @click="accept(user.id)">✓</button>
            <button class="req-btn decline" @click="decline(user.id)">✕</button>
          </div>
        </div>

        <div class="req-section-label" v-if="outgoing?.length">Outgoing</div>
        <div class="request-row" v-for="user in outgoing" :key="user.id">
          <span class="avatar sm">{{ user.avatar }}</span>
          <span class="friend-name">{{ user.username }}</span>
          <span class="pending-tag">Pending</span>
        </div>

        <div class="empty" v-if="!incoming?.length && !outgoing?.length">No requests.</div>
      </div>

      <div class="list add-panel" v-if="activeTab === 'add'">
        <div class="search-wrap">
          <input v-model="searchQuery" class="search-input" placeholder="Search username..." />
        </div>

        <div v-if="searchQuery.trim()">
          <div class="request-row" v-for="user in searchResults" :key="user.id">
            <span class="avatar sm">{{ user.avatar }}</span>
            <span class="friend-name">{{ user.username }}</span>
            <button v-if= "!user.requestSent" class="req-btn add" @click="sendFriendRequest(user)">+</button>
          </div>
          <div class="empty" v-if="searchResults.length === 0">No users found.</div>
        </div>

        <div class="empty" v-else>Type a username to search.</div>
      </div>
    </aside>

    <main class="right-panel">
      <div class="no-chat" v-if="!activeFriend">
        <span class="eyebrow">MIDNIGHT CLUB</span>
        <p>Select a friend to start messaging.</p>
      </div>

      <template v-else>
        <div class="chat-header">
          <span class="avatar">{{ activeFriend.avatar }}</span>
          <div class="chat-meta">
            <div class="chat-name">{{ activeFriend.username }}</div>
            <div class="chat-url">/{{ me?.username }}/messages/{{ activeFriend.username }}</div>
          </div>
          <div class="chat-status-dot"></div>
          <button class="logout-btn" v-if="!confirmingRemove" @click="confirmingRemove = true">
    Remove
  </button>
  <div class="logout-confirm" v-else>
    <span>Sure?</span>
    <button class="req-btn accept" @click="removeFriend(); confirmingRemove = false">✓</button>
    <button class="req-btn decline" @click="confirmingRemove = false">✕</button>
  </div>
        </div>

        <div class="messages" ref="messagesEl">
          <div
            v-for="msg in messageList"
            :key="msg.id"
            :class="['msg-wrap', msg.fromId === me?.id ? 'mine' : 'theirs']"
          >
            <div class="bubble">{{ msg.text }}</div>
            <div class="timestamp">{{ formatTime(msg.timestamp) }}</div>
          </div>
          <div class="empty centered" v-if="messageList.length === 0">
            No messages yet. Say something.
          </div>
        </div>

        <div class="input-bar">
          <input v-model="newMessage" placeholder="Type a message..." @keyup.enter="handleSend" />
          <button class="send-btn" @click="handleSend" :disabled="!newMessage.trim()">Send</button>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;800&family=Share+Tech+Mono&display=swap');

.page {
  height: 97vh;
  width: 99vw;
  overflow: hidden;
  position: fixed;
  background: #090c10;
  display: flex;
  font-family: 'Barlow Condensed', sans-serif;
  overflow: hidden;
}

.left-panel {
  width: 240px;
  min-width: 240px;
  background: #0e1318;
  border-right: 1px solid #1c2730;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #1c2730;
}

.me-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.me-name {
  font-size: 14px;
  font-weight: 800;
  color: #c8dae6;
  letter-spacing: 0.04em;
}

.logout-btn {
  background: none;
  border: 1px solid #1c2730;
  border-radius: 3px;
  color: #2a3f52;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn:hover {
  border-color: #ff3355;
  color: #ff3355;
}

.logout-confirm {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: #ff3355;
  letter-spacing: 0.08em;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 3px;
  background: #141c24;
  border: 1px solid #1c2730;
  color: #00d4ff;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.05em;
}
.avatar.sm {
  width: 30px;
  height: 30px;
  font-size: 10px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #1c2730;
}

.tab {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #2a3f52;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.tab.active {
  color: #00d4ff;
  border-bottom-color: #00d4ff;
}

.badge {
  background: #001a20;
  color: #00d4ff;
  border: 1px solid #004455;
  border-radius: 2px;
  font-size: 10px;
  padding: 1px 5px;
  font-family: 'Share Tech Mono', monospace;
}
.badge.alert {
  background: #1a0a0e;
  color: #ff3355;
  border-color: #3a1520;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.list::-webkit-scrollbar {
  width: 4px;
}
.list::-webkit-scrollbar-track {
  background: transparent;
}
.list::-webkit-scrollbar-thumb {
  background: #1c2730;
  border-radius: 2px;
}

.friend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.friend-row:hover,
.friend-row.active {
  background: #111820;
}
.friend-row.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #00d4ff;
}

.friend-name {
  font-size: 13px;
  font-weight: 700;
  color: #8aa0b0;
  letter-spacing: 0.04em;
  flex: 1;
}
.friend-row.active .friend-name {
  color: #c8dae6;
}

.online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00d4ff;
  box-shadow: 0 0 5px #00d4ff88;
}

.req-section-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #2a3f52;
  text-transform: uppercase;
  padding: 10px 16px 4px;
}

.request-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
}

.req-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.req-btn {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  border: 1px solid;
  background: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.req-btn.accept {
  border-color: #004455;
  color: #00d4ff;
}
.req-btn.accept:hover {
  background: #001a20;
}
.req-btn.decline {
  border-color: #3a1520;
  color: #ff3355;
}
.req-btn.decline:hover {
  background: #1a0a0e;
}
.req-btn.add {
  border-color: #004455;
  color: #00d4ff;
  margin-left: auto;
}
.req-btn.add:hover {
  background: #001a20;
}

.pending-tag {
  margin-left: auto;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #2a3f52;
}

.add-panel {
  padding: 12px 0;
}

.search-wrap {
  padding: 0 16px 12px;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  background: #080b0e;
  border: 1px solid #1c2730;
  border-radius: 3px;
  color: #c8dae6;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: #00d4ff55;
}
.search-input::placeholder {
  color: #1e2e3e;
}

.empty {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: #1e2e3e;
  padding: 16px;
  text-align: center;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.no-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.no-chat .eyebrow {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #00d4ff;
  opacity: 0.4;
}
.no-chat p {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: #1e2e3e;
  margin: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #1c2730;
  background: #0e1318;
}
.chat-meta {
  flex: 1;
}
.chat-name {
  font-size: 15px;
  font-weight: 800;
  color: #c8dae6;
  letter-spacing: 0.04em;
}
.chat-url {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: #2a3f52;
  letter-spacing: 0.05em;
  margin-top: 1px;
}
.chat-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00d4ff;
  box-shadow: 0 0 6px #00d4ff88;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.messages::-webkit-scrollbar {
  width: 4px;
}
.messages::-webkit-scrollbar-track {
  background: transparent;
}
.messages::-webkit-scrollbar-thumb {
  background: #1c2730;
  border-radius: 2px;
}

.msg-wrap {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}
.msg-wrap.mine {
  align-self: flex-end;
  align-items: flex-end;
}
.msg-wrap.theirs {
  align-self: flex-start;
  align-items: flex-start;
}

.bubble {
  padding: 9px 14px;
  border-radius: 3px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
.mine .bubble {
  background: #001a20;
  border: 1px solid #004455;
  color: #c8dae6;
}
.theirs .bubble {
  background: #111820;
  border: 1px solid #1c2730;
  color: #8aa0b0;
}

.timestamp {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: #1e2e3e;
  margin-top: 3px;
  letter-spacing: 0.05em;
}

.empty.centered {
  text-align: center;
  width: 100%;
}

.input-bar {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #1c2730;
  background: #0e1318;
}
.input-bar input {
  flex: 1;
  background: #080b0e;
  border: 1px solid #1c2730;
  border-radius: 3px;
  color: #c8dae6;
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.2s;
}
.input-bar input:focus {
  border-color: #00d4ff55;
}
.input-bar input::placeholder {
  color: #1e2e3e;
}

.send-btn {
  padding: 10px 20px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 3px;
  border: 1px solid #1c2730;
  background: #0e1318;
  color: #2a3f52;
  cursor: not-allowed;
  transition: all 0.2s;
}
.send-btn:not(:disabled) {
  background: #00d4ff;
  border-color: #00d4ff;
  color: #040608;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(0, 212, 255, 0.18);
}
.send-btn:not(:disabled):hover {
  box-shadow: 0 0 26px rgba(0, 212, 255, 0.3);
}
.send-btn:not(:disabled):active {
  transform: scale(0.97);
}

@media (max-width: 600px) {
  .left-panel {
    width: 200px;
    min-width: 200px;
  }
}
</style>
