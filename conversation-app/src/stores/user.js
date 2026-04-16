import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('userStore', () => {
  const isNewUser = ref(false)
  const user = ref(
    localStorage.getItem('authToken')
      ? {
          username: localStorage.getItem('username'),
          authToken: localStorage.getItem('authToken'),
          _id: localStorage.getItem('_id'),
        }
      : null,
  )

  const friends = ref([])
  const incoming = ref([])
  const outgoing = ref(JSON.parse(localStorage.getItem('outgoingRequests') || '[]'))
  const loading = ref(false)

  const host = 'https://stingray-app-u3bsh.ondigitalocean.app'

  async function register(username, password, firstName, lastName, email) {
    const response = await fetch(host + '/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, firstName, lastName, email }),
    })
    if (!response.ok) {
      const result = await response.json()
      throw new Error(
        result.errors ? Object.values(result.errors)[0].message : 'Could not create account',
      )
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
    localStorage.setItem('_id', result.user._id)
    user.value = result.user
  }

  function logout() {
    localStorage.removeItem('username')
    localStorage.removeItem('authToken')
    localStorage.removeItem('outgoingRequests')
    outgoing.value = []
    user.value = null
  }

  const isLoggedIn = computed(() => user.value !== null)

  async function getProfile() {
    const url = host + '/user'
    const token = localStorage.getItem('authToken')
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    const response = await fetch(url, options)
    if (response.ok) {
      const data = await response.json()

      if (data && Array.isArray(data.friends)) {
        friends.value = data.friends.map((f) => ({
          id: f.userId,
          username: f.username,
          avatar: f.username.substring(0, 2).toUpperCase(),
        }))
      }
      return data
    }
  }

  async function getUsers(limit = 10, skip = 0, search = '') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      search: search,
    })

    const url = `${host}/users?${params.toString()}`
    const token = localStorage.getItem('authToken')

    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }

    try {
      const response = await fetch(url, options)
      const data = await response.json()
      if (!response.ok) {
        return { error: data.message || 'Failed to fetch users' }
      }
      return data
    } catch (err) {
      console.error('Fetch error:', err)
      return { error: 'Connection refused or network issue' }
    }
  }

  async function fetchRelationships() {
    loading.value = true
    const token = localStorage.getItem('authToken')
    const myId = localStorage.getItem('_id')

    try {
      const response = await fetch(`${host}/friend-requests`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (Array.isArray(data)) {
        incoming.value = data
          .filter((req) => req.receiver.userId === myId)
          .map((req) => ({
            id: req._id,
            username: req.sender.username,
            userId: req.sender.userId,
            avatar: req.sender.username.substring(0, 2).toUpperCase(),
          }))

        const incomingIds = incoming.value.map((r) => String(r.userId))
        outgoing.value = outgoing.value.filter((r) => !incomingIds.includes(String(r.userId)))
        localStorage.setItem('outgoingRequests', JSON.stringify(outgoing.value))
      }
    } catch (error) {
      console.error('Store: Sync Failed', error)
    } finally {
      loading.value = false
    }
  }

  async function sendRequest(userId, username) {
    const token = localStorage.getItem('authToken')
    try {
      const response = await fetch(`${host}/friend-request/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const newRequest = { userId: String(userId), username }
        outgoing.value.push(newRequest)
        localStorage.setItem('outgoingRequests', JSON.stringify(outgoing.value))
        await fetchRelationships()
      }
    } catch (err) {
      console.log(err)
    }
  }

  async function acceptRequest(requestId) {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`${host}/friend-request/${requestId}?accept=true`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: requestId }),
    })
    if (response.ok) {
      await fetchRelationships()
    }
  }

  async function declineRequest(requestId) {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`${host}/friend-request/${requestId}?accept=false`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: requestId }),
    })
    if (response.ok) {
      await fetchRelationships()
    }
  }

  async function removeFriend(userId) {
    const token = localStorage.getItem('authToken')
    const response = await fetch(`${host}/friend/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: userId }),
    })
    if (response.ok) {
      await getProfile()
    }
  }

  return {
    removeFriend,
    user,
    login,
    register,
    logout,
    isLoggedIn,
    isNewUser,
    getUsers,
    getProfile,
    acceptRequest,
    fetchRelationships,
    declineRequest,
    sendRequest,
    friends,
    incoming,
    outgoing,
  }
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
  { test: (val) => !!val, message: 'Email is required' },
  { test: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), message: 'Invalid email format' },
]

export function validateEmail(email) {
  const errors = []
  const trimmed = email?.trim() || ''
  for (const rule of emailRules) {
    if (!rule.test(trimmed)) errors.push(rule.message)
  }
  return errors
}
