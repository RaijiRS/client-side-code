<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

if (!userStore.user) router.push('/signin')

const { friends, incoming, outgoing } = storeToRefs(userStore)
const { chats, activeChat, messages, pendingInvites } = storeToRefs(chatStore)
const me = computed(() => userStore.user)

const activeTab = ref('chats')

async function loadData() {
  try {
    await userStore.fetchRelationships()
    await userStore.getProfile()
    await chatStore.fetchChats()
    await chatStore.fetchPendingInvites()
  } catch (err) {
    console.error(err)
  }
}
loadData()

async function accept(fromId) {
  try {
    await userStore.acceptRequest(fromId)
    await userStore.fetchRelationships()
  } catch (err) {
    console.error('Accept failed:', err)
  }
}

async function decline(fromId) {
  try {
    await userStore.declineRequest(fromId)
    await userStore.fetchRelationships()
  } catch (err) {
    console.error('Decline failed:', err)
  }
}

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

async function runSearch(query) {
  const q = query.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const data = await userStore.getUsers(10, 0, q)
    if (data && Array.isArray(data.users)) {
      searchResults.value = data.users
        .filter((u) => {
          const isMe = u.username.toLowerCase() === me.value?.username?.toLowerCase()
          const isFriend = friends.value.some(
            (f) => f.username.toLowerCase() === u.username.toLowerCase(),
          )
          return !isMe && !isFriend
        })
        .map((u) => ({
          ...u,
          requestSent: outgoing.value.some((req) => String(req.userId) === String(u._id || u.id)),
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
watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => runSearch(val), 300)
})

async function sendFriendRequest(targetUser) {
  if (!me.value) return
  const targetId = targetUser._id || targetUser.id
  const alreadySent = outgoing.value.some((req) => String(req.userId) === String(targetId))
  const alreadyFriends = friends.value.some((f) => String(f._id || f.id) === String(targetId))
  if (alreadySent || alreadyFriends) return
  try {
    await userStore.sendRequest(targetId, targetUser.username)
    searchQuery.value = ''
    searchResults.value = []
    await userStore.fetchRelationships()
  } catch (err) {
    console.error('Send request failed:', err)
  }
}

const createStep = ref(null)
const newChatName = ref('')
const newChatId = ref(null)
const isCreating = ref(false)
const isSendingInvites = ref(false)
const selectedFriends = ref([])
const invitesSentCount = ref(0)

const pickSearchQuery = ref('')
const pickSearchResults = ref([])
const isPickSearching = ref(false)

async function runPickSearch(query) {
  const q = query.trim()
  if (!q) {
    pickSearchResults.value = []
    return
  }
  isPickSearching.value = true
  try {
    const data = await userStore.getUsers(10, 0, q)
    if (data && Array.isArray(data.users)) {
      pickSearchResults.value = data.users.filter((u) => {
        const isMe = u.username.toLowerCase() === me.value?.username?.toLowerCase()
        const isFriend = friends.value.some(
          (f) => f.username.toLowerCase() === u.username.toLowerCase(),
        )
        return !isMe && !isFriend
      })
    } else {
      pickSearchResults.value = []
    }
  } catch (err) {
    console.error('Pick search error:', err)
    pickSearchResults.value = []
  } finally {
    isPickSearching.value = false
  }
}

let pickSearchTimeout = null
watch(pickSearchQuery, (val) => {
  clearTimeout(pickSearchTimeout)
  pickSearchTimeout = setTimeout(() => runPickSearch(val), 300)
})

function startCreate() {
  createStep.value = 'naming'
  newChatName.value = ''
  newChatId.value = null
  selectedFriends.value = []
  invitesSentCount.value = 0
  pickSearchQuery.value = ''
  pickSearchResults.value = []
}

function cancelCreate() {
  createStep.value = null
  newChatName.value = ''
  newChatId.value = null
  selectedFriends.value = []
  invitesSentCount.value = 0
  pickSearchQuery.value = ''
  pickSearchResults.value = []
  inviteMode.value = false
}

async function submitChatName() {
  const name = newChatName.value.trim()
  if (!name || isCreating.value) return
  isCreating.value = true
  try {
    const chat = await chatStore.createChat(name)
    if (!chat) return
    newChatId.value = chat._id
    createStep.value = 'picking'
  } catch (err) {
    console.error('Create chat failed:', err)
  } finally {
    isCreating.value = false
  }
}

function toggleFriendSelection(friend) {
  const friendId = friend._id || friend.id
  const idx = selectedFriends.value.findIndex((f) => (f._id || f.id) === friendId)
  if (idx === -1) selectedFriends.value.push(friend)
  else selectedFriends.value.splice(idx, 1)
}

function isFriendSelected(friend) {
  const friendId = friend._id || friend.id
  return selectedFriends.value.some((f) => (f._id || f.id) === friendId)
}

async function sendInvites() {
  const chatId = inviteMode.value ? activeChat.value?._id : newChatId.value

  if (!chatId || selectedFriends.value.length === 0 || isSendingInvites.value) return

  isSendingInvites.value = true

  try {
    const results = await Promise.allSettled(
      selectedFriends.value.map((friend) => chatStore.inviteMember(chatId, friend._id)),
    )

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value).length
    invitesSentCount.value = sent

    await chatStore.fetchChat(chatId)

    createStep.value = 'confirmed'
  } catch (err) {
    console.error('Send invites failed:', err)
  } finally {
    isSendingInvites.value = false
  }
}

async function selectChat(chat) {
  cancelCreate()
  const chatId = chat._id || chat.id
  await chatStore.fetchChat(chatId)
  await chatStore.fetchMessages(chatId)
  nextTick(scrollToBottom)
}

async function acceptInvite(invite) {
  await chatStore.respondToInvite(invite.chatId, invite._id || invite.id, true)
  if (chatStore.activeChat) {
    await chatStore.fetchMessages(chatStore.activeChat._id)
    nextTick(scrollToBottom)
  }
}

async function declineInvite(invite) {
  await chatStore.respondToInvite(invite.chatId, invite._id || invite.id, false)
}

const confirmingLeave = ref(false)

function isOwner(chat) {
  if (!chat || !me.value) return false
  const ownerId = chat.owner.user_id
  const myId = me.value._id
  return String(ownerId) === String(myId)
}

async function leaveChat() {
  if (!activeChat.value) return
  await chatStore.leaveChat(activeChat.value._id || activeChat.value.id)
  confirmingLeave.value = false
}

async function deleteChat() {
  if (!activeChat.value) return
  console.log(activeChat.value)
  await chatStore.deleteChat(activeChat.value.id)
  confirmingLeave.value = false
  await chatStore.fetchPendingInvites()
}

const newMessage = ref('')
const messagesEl = ref(null)
const isSending = ref(false)

async function handleSend() {
  const text = newMessage.value.trim()
  if (!text || !activeChat.value || isSending.value) return
  isSending.value = true
  newMessage.value = ''
  await chatStore.sendMessage(activeChat.value._id || activeChat.value.id, text)
  isSending.value = false
  nextTick(scrollToBottom)
}

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

watch(messages, () => nextTick(scrollToBottom), { flush: 'post' })

function chatLabel(chat) {
  if (chat.members?.length === 2) {
    const myId = me.value?._id || me.value?.id
    const otherId = chat.members.find((id) => id !== myId)
    const friend = friends.value.find((f) => (f._id || f.id) === otherId)
    return friend?.username ?? chat.group_name
  }
  return chat.group_name
}

function chatAvatar(chat) {
  return chatLabel(chat)?.substring(0, 2).toUpperCase() ?? '??'
}

const totalRequestCount = computed(
  () => (incoming.value?.length ?? 0) + (pendingInvites.value?.length ?? 0),
)

const confirmingLogout = ref(false)

function logout() {
  activeChat.value = null
  userStore.logout()
  router.push('/signin')
}

const usernames = computed(() => activeChat.value?.users?.map((u) => u.username).join(', '))

const inviteMode = ref(false)

async function startInvite(chat) {
  await selectChat(chat)

  inviteMode.value = true
  createStep.value = 'picking'
  newChatId.value = chat.id
  newChatName.value = chat.name || 'Chat'
  console.log(createStep.value)
  selectedFriends.value = []
}
</script>

<template>
  <div v-if="me" class="page">
    <aside class="left-panel">
      <div class="panel-header">
        <div class="me-badge">
          <span class="avatar">{{ me.username?.substring(0, 2).toUpperCase() }}</span>
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
          :class="['tab', activeTab === 'chats' ? 'active' : '']"
          @click="activeTab = 'chats'"
        >
          Chats
          <span class="badge" v-if="chats?.length">{{ chats.length }}</span>
        </button>
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
          <span class="badge alert" v-if="totalRequestCount > 0">{{ totalRequestCount }}</span>
        </button>
      </div>

      <div class="list" v-if="activeTab === 'chats'">
        <div class="create-panel" v-if="createStep === 'naming'">
          <div class="req-section-label">New chat name</div>
          <div class="create-input-row">
            <input
              v-model="newChatName"
              class="search-input"
              placeholder="e.g. squad, work, etc."
              @keyup.enter="submitChatName"
              autofocus
            />
          </div>
          <div class="create-actions">
            <button
              class="create-btn"
              @click="submitChatName"
              :disabled="!newChatName.trim() || isCreating"
            >
              {{ isCreating ? '...' : 'Create' }}
            </button>
            <button class="cancel-btn" @click="cancelCreate">Cancel</button>
          </div>
        </div>

        <template v-else-if="createStep === 'picking'">
          <div class="req-section-label">
            {{ inviteMode ? 'Invite to' : 'Create chat with' }} <em>{{ newChatName }}</em>
          </div>

          <template v-if="friends?.length">
            <div class="req-section-label" style="padding-top: 4px">Friends</div>
            <div
              v-for="friend in friends"
              :key="friend._id || friend.id"
              :class="['friend-row', isFriendSelected(friend) ? 'selected' : '']"
              @click="toggleFriendSelection(friend)"
            >
              <span class="avatar sm">{{
                (friend.avatar || friend.username)?.substring(0, 2).toUpperCase()
              }}</span>
              <span class="friend-name">{{ friend.username }}</span>
              <span class="select-indicator">{{ isFriendSelected(friend) ? '✓' : '+' }}</span>
            </div>
          </template>

          <div class="req-section-label" style="padding-top: 8px">Others</div>
          <div class="search-wrap" style="padding: 4px 16px 8px">
            <input
              v-model="pickSearchQuery"
              class="search-input"
              placeholder="Search username..."
            />
          </div>
          <template v-if="pickSearchQuery.trim()">
            <div
              v-for="user in pickSearchResults"
              :key="user._id || user.id"
              :class="['friend-row', isFriendSelected(user) ? 'selected' : '']"
              @click="toggleFriendSelection(user)"
            >
              <span class="avatar sm">{{ user.username?.substring(0, 2).toUpperCase() }}</span>
              <span class="friend-name">{{ user.username }}</span>
              <span class="select-indicator">{{ isFriendSelected(user) ? '✓' : '+' }}</span>
            </div>
            <div class="empty" v-if="pickSearchResults.length === 0 && !isPickSearching">
              No users found.
            </div>
          </template>
          <div class="empty" v-else-if="!friends?.length">
            No friends yet — search above to add someone.
          </div>

          <div class="create-actions" style="padding: 8px 16px; flex-direction: column; gap: 6px">
            <button
              class="create-btn"
              @click="sendInvites"
              :disabled="selectedFriends.length === 0 || isSendingInvites"
            >
              {{
                isSendingInvites
                  ? 'Sending...'
                  : `Send Invite${selectedFriends.length !== 1 ? 's' : ''}${selectedFriends.length > 0 ? ' (' + selectedFriends.length + ')' : ''}`
              }}
            </button>
            <button class="cancel-btn" @click="cancelCreate">Cancel</button>
          </div>
        </template>

        <template v-else-if="createStep === 'confirmed'">
          <div class="confirmed-panel">
            <div class="confirmed-icon">✓</div>
            <div class="confirmed-title">Invites sent!</div>
            <div class="confirmed-sub">
              {{ invitesSentCount }} invite{{ invitesSentCount !== 1 ? 's' : '' }} sent. Friends
              will see them in their Requests tab.
            </div>
            <button class="create-btn" style="margin-top: 12px; width: 100%" @click="cancelCreate">
              Done
            </button>
          </div>
        </template>

        <template v-else>
          <div class="new-chat-row" @click="startCreate">
            <span class="new-chat-plus">+</span>
            <span class="new-chat-label">New chat</span>
          </div>

          <div
            v-for="chat in chats"
            :key="chat._id"
            :class="['friend-row', activeChat?._id === chat._id ? 'active' : '']"
            @click="selectChat(chat)"
          >
            <span class="avatar sm">{{ chatAvatar(chat) }}</span>
            <span class="friend-name">{{ chatLabel(chat) }}</span>
            <button class="req-btn add" @click="startInvite(chat)">+</button>
            <span class="owner-crown" v-if="isOwner(chat)" title="You own this chat">◆</span>
            <span class="online-dot" v-else></span>
          </div>

          <div class="empty" v-if="!chats?.length">No chats yet. Hit + New to start one.</div>
        </template>
      </div>

      <div class="list add-panel" v-if="activeTab === 'friends'">
        <div class="search-wrap">
          <input v-model="searchQuery" class="search-input" placeholder="Search username..." />
        </div>

        <div v-if="searchQuery.trim()">
          <div class="req-section-label">Results</div>
          <div class="request-row" v-for="user in searchResults" :key="user._id || user.id">
            <span class="avatar sm">{{ user.username?.substring(0, 2).toUpperCase() }}</span>
            <span class="friend-name">{{ user.username }}</span>
            <button v-if="!user.requestSent" class="req-btn add" @click="sendFriendRequest(user)">
              +
            </button>
            <span v-else class="pending-tag">Pending</span>
          </div>
          <div class="empty" v-if="searchResults.length === 0 && !isSearching">No users found.</div>
        </div>

        <div v-else>
          <div class="req-section-label" v-if="friends?.length">Your friends</div>
          <div class="request-row" v-for="friend in friends" :key="friend._id || friend.id">
            <span class="avatar sm">{{
              (friend.avatar || friend.username)?.substring(0, 2).toUpperCase()
            }}</span>
            <span class="friend-name">{{ friend.username }}</span>
          </div>
          <div class="empty" v-if="!friends?.length">No friends yet.</div>
        </div>
      </div>

      <div class="list" v-if="activeTab === 'requests'">
        <template v-if="pendingInvites?.length">
          <div class="req-section-label">Chat invites</div>
          <div class="request-row" v-for="invite in pendingInvites" :key="invite._id">
            <span class="avatar sm">{{
              invite.from_name?.substring(0, 2).toUpperCase() ?? '??'
            }}</span>
            <div class="invite-info">
              <span class="friend-name">{{ invite.chatName || 'Unnamed chat' }}</span>
              <span class="invite-from">from {{ invite.sender.username }}</span>
            </div>
            <div class="req-actions">
              <button class="req-btn accept" @click="acceptInvite(invite)">✓</button>
              <button class="req-btn decline" @click="declineInvite(invite)">✕</button>
            </div>
          </div>
        </template>

        <template v-if="incoming?.length">
          <div class="req-section-label">Friend requests</div>
          <div class="request-row" v-for="user in incoming" :key="user._id || user.id">
            <span class="avatar sm">{{
              (user.avatar || user.username)?.substring(0, 2).toUpperCase()
            }}</span>
            <span class="friend-name">{{ user.username }}</span>
            <div class="req-actions">
              <button class="req-btn accept" @click="accept(user._id || user.id)">✓</button>
              <button class="req-btn decline" @click="decline(user._id || user.id)">✕</button>
            </div>
          </div>
        </template>

        <template v-if="outgoing?.length">
          <div class="req-section-label">Outgoing</div>
          <div class="request-row" v-for="user in outgoing" :key="user._id || user.id">
            <span class="avatar sm">{{
              (user.avatar || user.username)?.substring(0, 2).toUpperCase()
            }}</span>
            <span class="friend-name">{{ user.username }}</span>
            <span class="pending-tag">Pending</span>
          </div>
        </template>

        <div class="empty" v-if="!incoming?.length && !outgoing?.length && !pendingInvites?.length">
          No requests.
        </div>
      </div>
    </aside>

    <main class="right-panel">
      <div class="no-chat" v-if="!activeChat">
        <span class="eyebrow">MIDNIGHT CLUB</span>
        <p>Create or select a chat to start messaging.</p>
      </div>

      <template v-else>
        <div class="chat-header">
          <span class="avatar">{{ chatAvatar(activeChat) }}</span>
          <div class="chat-meta">
            <div class="chat-name">{{ chatLabel(activeChat) }}</div>
            <div class="chat-url">{{ activeChat.users?.length }} members: {{ usernames }}</div>
          </div>
          <div class="chat-status-dot"></div>

          <template v-if="!confirmingLeave">
            <button
              v-if="isOwner(activeChat)"
              class="logout-btn danger"
              @click="confirmingLeave = true"
            >
              Delete
            </button>
            <button v-else class="logout-btn" @click="confirmingLeave = true">Leave</button>
          </template>
          <div class="logout-confirm" v-else>
            <span>{{ isOwner(activeChat) ? 'Delete chat?' : 'Leave chat?' }}</span>
            <button
              class="req-btn accept"
              @click="isOwner(activeChat) ? deleteChat() : leaveChat()"
            >
              ✓
            </button>
            <button class="req-btn decline" @click="confirmingLeave = false">✕</button>
          </div>
        </div>

        <div class="messages" ref="messagesEl">
          <div
            v-for="msg in messages"
            :key="msg._id || msg.id"
            :class="['msg-wrap', msg.sender === (me?._id || me?.id) ? 'mine' : 'theirs']"
          >
            <div class="sender-name" v-if="msg.sender_id !== (me?._id || me?.id)">
              {{ msg.sender }}
            </div>
            <div class="bubble">{{ msg.content }}</div>
          </div>
          <div class="empty centered" v-if="messages.length === 0">
            No messages yet. Say something.
          </div>
        </div>

        <div class="input-bar">
          <input v-model="newMessage" placeholder="Type a message..." @keyup.enter="handleSend" />
          <button class="send-btn" @click="handleSend" :disabled="!newMessage.trim() || isSending">
            Send
          </button>
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
.logout-btn.danger {
  border-color: #3a1520;
  color: #ff3355;
}
.logout-btn.danger:hover {
  background: #1a0a0e;
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

.new-chat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid #1c2730;
  margin-bottom: 4px;
  transition: background 0.15s;
}
.new-chat-row:hover {
  background: #111820;
}

.new-chat-plus {
  width: 30px;
  height: 30px;
  border-radius: 3px;
  border: 1px dashed #1c4455;
  color: #00d4ff;
  font-family: 'Share Tech Mono', monospace;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s;
}
.new-chat-row:hover .new-chat-plus {
  border-color: #00d4ff55;
}

.new-chat-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: #2a3f52;
  letter-spacing: 0.1em;
}
.new-chat-row:hover .new-chat-label {
  color: #00d4ff;
}

.create-panel {
  padding: 4px 0 8px;
}
.create-input-row {
  padding: 4px 16px 8px;
}

.create-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px;
}

.create-btn {
  flex: 1;
  background: #00d4ff;
  border: none;
  border-radius: 3px;
  color: #040608;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 7px 0;
  cursor: pointer;
  transition: opacity 0.2s;
}
.create-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.create-btn:not(:disabled):hover {
  opacity: 0.85;
}

.cancel-btn {
  flex: 1;
  background: none;
  border: 1px solid #1c2730;
  border-radius: 3px;
  color: #2a3f52;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  padding: 7px 0;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover {
  border-color: #ff3355;
  color: #ff3355;
}

.select-indicator {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: #00d4ff44;
  transition: color 0.15s;
  margin-left: auto;
}
.friend-row.selected .select-indicator {
  color: #00d4ff;
}
.friend-row:hover .select-indicator {
  color: #00d4ff88;
}

.confirmed-panel {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}
.confirmed-icon {
  width: 36px;
  height: 36px;
  border-radius: 3px;
  border: 1px solid #004455;
  color: #00d4ff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.confirmed-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: #c8dae6;
  letter-spacing: 0.06em;
}
.confirmed-sub {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: #2a3f52;
  letter-spacing: 0.05em;
  line-height: 1.6;
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
.friend-row.active,
.friend-row.selected {
  background: #111820;
}
.friend-row.active::before,
.friend-row.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #00d4ff;
}
.friend-row.selected::before {
  background: #00d4ff88;
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

.owner-crown {
  font-size: 8px;
  color: #00d4ff88;
}

.req-section-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: #2a3f52;
  text-transform: uppercase;
  padding: 10px 16px 4px;
}
.req-section-label em {
  font-style: normal;
  color: #00d4ff88;
}

.request-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
}

.invite-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}
.invite-from {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: #2a3f52;
  letter-spacing: 0.06em;
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
  height: 97vh;
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

.sender-name {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: #2a3f52;
  letter-spacing: 0.08em;
  margin-bottom: 3px;
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
