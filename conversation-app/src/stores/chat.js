import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chatStore', () => {
  const host = 'https://stingray-app-u3bsh.ondigitalocean.app'

  const chats = ref([])
  const activeChat = ref(null)
  const messages = ref([])
  const pendingInvites = ref([])
  const loading = ref(false)
  const error = ref(null)

  function authHeaders() {
    const token = localStorage.getItem('authToken')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  function normalizeChat(chat) {
    if (!chat) return chat
    const id = chat._id || chat.id
    return { ...chat, _id: id, id }
  }

  async function fetchChats() {
    error.value = null

    try {
      const response = await fetch(`${host}/user`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) throw new Error('Failed to fetch user')

      const data = await response.json()

      const chatIds = data.chat_sessions || []
      console.log('chatIds:', chatIds)

      const chatResponses = await Promise.all(
        chatIds.map(async (id) => {
          const res = await fetch(`${host}/chat/${id}`, {
            headers: authHeaders(),
          })

          if (!res.ok) return null

          const chatData = await res.json()
          return normalizeChat(chatData)
        }),
      )

      chats.value = chatResponses.filter(Boolean)

      return chats.value
    } catch (err) {
      error.value = err.message
      console.error('fetchChats:', err)
      return []
    }
  }

  async function fetchPendingInvites() {
    error.value = null

    try {
      const response = await fetch(`${host}/user`, {
        method: 'GET',
        headers: authHeaders(),
      })

      if (!response.ok) throw new Error('Failed to fetch invites')

      const data = await response.json()

      const requests = data.requests || []

      pendingInvites.value = requests
        .filter((req) => req.kind === 'ChatInvite')
        .map((req) => ({
          id: req._id,
          chatId: req.chat.chatId,
          chatName: req.chat.name,
          sender: req.sender,
          receiver: req.receiver,
          createdAt: req.createdAt,
        }))

      console.log('pendingInvites:', pendingInvites.value)

      return pendingInvites.value
    } catch (err) {
      error.value = err.message
      console.error('fetchPendingInvites:', err)
      return []
    }
  }

  async function createChat(groupName) {
    error.value = null
    try {
      const response = await fetch(`${host}/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ group_name: groupName, chat_type: 'group' }),
      })
      if (!response.ok) throw new Error('Failed to create chat')
      const data = normalizeChat(await response.json())
      chats.value.push(data)
      console.log('chat created', data)
      return data
    } catch (err) {
      error.value = err.message
      console.error('createChat:', err)
      return null
    }
  }

  async function fetchChat(chatId) {
    error.value = null
    try {
      const response = await fetch(`${host}/chat/${chatId}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch chat')
      const data = normalizeChat(await response.json())
      activeChat.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('fetchChat:', err)
      return null
    }
  }

  async function updateChat(chatId, { groupName, logo, background } = {}) {
    error.value = null
    try {
      const body = {}
      if (groupName) body.group_name = groupName
      if (logo) body.logo = logo
      if (background) body.background = background

      const response = await fetch(`${host}/chat/${chatId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error('Failed to update chat')
      const data = normalizeChat(await response.json())
      const idx = chats.value.findIndex((c) => c._id === chatId || c.id === chatId)
      if (idx !== -1) chats.value[idx] = data
      if (activeChat.value?._id === chatId || activeChat.value?.id === chatId) {
        activeChat.value = data
      }
      return data
    } catch (err) {
      error.value = err.message
      console.error('updateChat:', err)
      return null
    }
  }

  async function deleteChat(chatId) {
    error.value = null
    try {
      const response = await fetch(`${host}/chat/${chatId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to delete chat')
      chats.value = chats.value.filter((c) => c._id !== chatId && c.id !== chatId)
      if (activeChat.value?._id === chatId || activeChat.value?.id === chatId) {
        activeChat.value = null
        messages.value = []
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('deleteChat:', err)
      return false
    }
  }

  async function inviteMember(chatId, userId) {
    error.value = null
    try {
      const response = await fetch(`${host}/chat/${chatId}/invitation/${userId}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to send invite')
      return true
    } catch (err) {
      error.value = err.message
      console.error('inviteMember:', err)
      return false
    }
  }

  async function respondToInvite(chatId, requestId, accept) {
    error.value = null
    try {
      const response = await fetch(
        `${host}/chat/${chatId}/invitation/${requestId}?accept=${accept}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
        },
      )
      if (!response.ok) throw new Error('Failed to respond to invite')
      const data = await response.json()

      pendingInvites.value = pendingInvites.value.filter(
        (i) => i._id !== requestId && i.id !== requestId,
      )

      if (accept) {
        const chat = normalizeChat(data)
        const alreadyIn = chats.value.some((c) => c._id === chat._id)
        if (!alreadyIn) chats.value.push(chat)
        activeChat.value = chat
      }

      return data
    } catch (err) {
      error.value = err.message
      console.error('respondToInvite:', err)
      return null
    }
  }

  async function leaveChat(chatId) {
    error.value = null
    try {
      const response = await fetch(`${host}/chat/${chatId}/membership`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to leave chat')
      chats.value = chats.value.filter((c) => c._id !== chatId && c.id !== chatId)
      if (activeChat.value?._id === chatId || activeChat.value?.id === chatId) {
        activeChat.value = null
        messages.value = []
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('leaveChat:', err)
      return false
    }
  }

  async function fetchMessages(chatId, { limit = 50, offset = 0, search = '' } = {}) {
    loading.value = true
    error.value = null
    try {
      const params = new URLSearchParams({ limit, offset })
      if (search) params.set('search', search)
      const response = await fetch(`${host}/chat/${chatId}/messages?${params}`, {
        method: 'GET',
        headers: authHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      messages.value = Array.isArray(data) ? data : []
      return messages.value
    } catch (err) {
      error.value = err.message
      console.error('fetchMessages:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(chatId, message) {
    error.value = null
    try {
      const response = await fetch(`${host}/chat/${chatId}/message`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message }),
      })
      if (!response.ok) throw new Error('Failed to send message')
      const data = await response.json()
      messages.value.push(data)
      console.log(messages.value)
      return data
    } catch (err) {
      error.value = err.message
      console.error('sendMessage:', err)
      return null
    }
  }

  return {
    chats,
    activeChat,
    messages,
    pendingInvites,
    loading,
    error,
    fetchChats,
    fetchPendingInvites,
    createChat,
    fetchChat,
    updateChat,
    deleteChat,
    inviteMember,
    respondToInvite,
    leaveChat,
    fetchMessages,
    sendMessage,
  }
})
