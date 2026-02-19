export default class Message {
  constructor(username, firstName, lastName, message) {
    this.message = message ?? ''
    this.username = username ?? ''
    this.firstName = firstName ?? ''
    this.lastName = lastName ?? ''
    this.isRedacted = false
  }

  clear() {
    this.message = ''
    this.username = ''
    this.firstName = ''
    this.lastName = ''
  }
}
