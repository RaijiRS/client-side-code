import messages from '@/data/message'
import Message from '@/models/Message'
import { reactive, computed } from 'vue'
import { defineStore } from 'pinia'

//pinia store with reactive variable

export const useMessageStore = defineStore('messageStore', () => {
  const messageData = reactive([...messages])

  //action to add new message
  function add(message) {
    if (message instanceof Message) {
      messageData.push(message)
    }
  }

  function redact(message) {
    if (messages.length == 0) {
      return
    }
    //encrypt
    return btoa(message)
  }

  function unredact(message) {
    if (messages.length == 0) {
      return
    }
    //decrypt
    return atob(message)
  }

  const Users = computed(() => {
    const users = messageData.map((m) => ({
      username: m.username,
      firstName: m.firstName,
      lastName: m.lastName,
    }))

    return users.filter(
      (user, index, self) => index === self.findIndex((t) => t.username === user.username),
    )
  })

  function toggleRedact(index) {
    const msg = messageData[index]

    if (!msg.isRedacted) {
      msg.message = redact(msg.message)
      msg.isRedacted = true
    } else {
      msg.message = unredact(msg.message)
      msg.isRedacted = !msg.isRedacted
    }
  }

  return { messageData, add, redact, unredact, Users, toggleRedact }
})
