export const db = {
  users: [
    {
      id: 1,
      username: 'NightRacer',
      password: 'Pass1234!',
      avatar: 'NR',
      friends: [2, 3],
      incomingRequests: [4, 5],
      outgoingRequests: [6],
    },
    {
      id: 2,
      username: 'DriftKing',
      password: 'Pass1234!',
      avatar: 'DK',
      friends: [1, 3],
      incomingRequests: [],
      outgoingRequests: [5],
    },
    {
      id: 3,
      username: 'TurboGhost',
      password: 'Pass1234!',
      avatar: 'TG',
      friends: [1, 2],
      incomingRequests: [6],
      outgoingRequests: [],
    },
    {
      id: 4,
      username: 'StreetPhantom',
      password: 'Pass1234!',
      avatar: 'SP',
      friends: [],
      incomingRequests: [],
      outgoingRequests: [1],
    },
    {
      id: 5,
      username: 'NeonViper',
      password: 'Pass1234!',
      avatar: 'NV',
      friends: [],
      incomingRequests: [],
      outgoingRequests: [1, 2],
    },
    {
      id: 6,
      username: 'CitySlayer',
      password: 'Pass1234!',
      avatar: 'CS',
      friends: [],
      incomingRequests: [1],
      outgoingRequests: [3],
    },
  ],

  messages: [
    { id: 1, fromId: 1, toId: 2, text: 'Yo, race tonight?', timestamp: '2025-03-18T21:00:00' },
    {
      id: 2,
      fromId: 2,
      toId: 1,
      text: 'Yeah, usual spot. 11pm.',
      timestamp: '2025-03-18T21:02:00',
    },
    { id: 3, fromId: 1, toId: 2, text: 'Bet. Bring that turbo.', timestamp: '2025-03-18T21:03:00' },
    { id: 4, fromId: 2, toId: 1, text: 'Already on it lol', timestamp: '2025-03-18T21:05:00' },
    {
      id: 5,
      fromId: 1,
      toId: 3,
      text: 'You see that run last night?',
      timestamp: '2025-03-18T22:10:00',
    },
    { id: 6, fromId: 3, toId: 1, text: 'Insane. What trap?', timestamp: '2025-03-18T22:12:00' },
    { id: 7, fromId: 1, toId: 3, text: 'Quarter mile, 9.8.', timestamp: '2025-03-18T22:13:00' },
    { id: 8, fromId: 3, toId: 1, text: 'No way. Stock block?', timestamp: '2025-03-18T22:15:00' },
  ],
}

export function findUser(username, password) {
  return db.users.find((u) => u.username === username && u.password === password) ?? null
}

export function findUserById(id) {
  return db.users.find((u) => u.id === id) ?? null
}

export function getMessages(userAId, userBId) {
  return db.messages
    .filter(
      (m) =>
        (m.fromId === userAId && m.toId === userBId) ||
        (m.fromId === userBId && m.toId === userAId),
    )
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

let nextMsgId = db.messages.length + 1
export function sendMessage(fromId, toId, text) {
  const msg = {
    id: nextMsgId++,
    fromId,
    toId,
    text,
    timestamp: new Date().toISOString(),
  }
  db.messages.push(msg)
  return msg
}

export function acceptRequest(currentUserId, fromUserId) {
  const current = findUserById(currentUserId)
  const from = findUserById(fromUserId)
  if (!current || !from) return
  current.incomingRequests = current.incomingRequests.filter((id) => id !== fromUserId)
  from.outgoingRequests = from.outgoingRequests.filter((id) => id !== currentUserId)
  if (!current.friends.includes(fromUserId)) current.friends.push(fromUserId)
  if (!from.friends.includes(currentUserId)) from.friends.push(currentUserId)
}

export function declineRequest(currentUserId, fromUserId) {
  const current = findUserById(currentUserId)
  const from = findUserById(fromUserId)
  if (!current || !from) return
  current.incomingRequests = current.incomingRequests.filter((id) => id !== fromUserId)
  from.outgoingRequests = from.outgoingRequests.filter((id) => id !== currentUserId)
}

export function sendFriendRequest(fromUserId, toUserId) {
  const from = findUserById(fromUserId)
  const to = findUserById(toUserId)
  if (!from || !to) return
  if (!from.outgoingRequests.includes(toUserId)) from.outgoingRequests.push(toUserId)
  if (!to.incomingRequests.includes(fromUserId)) to.incomingRequests.push(fromUserId)
}

export function createUser(username, password) {
  const exists = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase())
  if (exists) throw new Error('Username already taken')

  const avatar = username.slice(0, 2).toUpperCase()
  const newUser = {
    id: db.users.length + 1,
    username,
    password,
    avatar,
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  }
  db.users.push(newUser)
  return newUser
}
