const SessionManager =
  require('./SessionManager')

class Context {

  constructor({
    sock,
    message,
    client
  }) {

    this.sender = message.key.senderPn || message.key.participantPn

    const sender = message.key.senderPn || message.key.participantPn
    this.pushname = message.pushName


    //console.log(message)

    


    this.sock = sock
    this.message = message
    this.client = client

    this.session = SessionManager.getSession( client.id, this.sender )

    //console.log(this.sender)

    this.from = message.key.remoteJidAlt || message.key.remoteJid

    this.body =
      this.getMessageBody()
  }

  gotoFlow(flow) {

  this.setSession({

    flow,

    step: 'start'

  })

  this.goto = flow
}

  setSession(data) {
  const SessionManager =
    require('./SessionManager')

  this.session =
    SessionManager.updateSession(
      this.client.id,
      this.sender,
      data
    )

  return this.session
}

  getMessageBody() {

    const msg = this.message.message

    return (
      msg?.conversation ||
      msg?.extendedTextMessage?.text ||
      msg?.imageMessage?.caption ||
      msg?.videoMessage?.caption ||
      msg?.buttonsResponseMessage?.selectedButtonId ||
      msg?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ''
    )
  }

  async reply(text) {

    return await this.sock.sendMessage(
      this.from,
      { text }
    )
  }
}

module.exports = Context