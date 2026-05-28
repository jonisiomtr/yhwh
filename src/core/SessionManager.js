const fs = require('fs')
const path = require('path')

class SessionManager {

  static getPath(clientId) {

    return path.join(
      __dirname,
      `../../sessionsData/${clientId}.json`
    )
  }

  static ensureDirectory(filePath) {

    const dir =
    path.dirname(filePath)

    if (!fs.existsSync(dir)) {

      fs.mkdirSync(dir, {
        recursive: true
      })

    }

  }

  static load(clientId) {

    const filePath =
      this.getPath(clientId)

    // GARANTE PASTA
    this.ensureDirectory(filePath)

    if (!fs.existsSync(filePath)) {

      fs.writeFileSync(
        filePath,
        JSON.stringify({}, null, 2)
      )

    }

    return JSON.parse(
      fs.readFileSync(filePath)
    )
  }

  static save(clientId, data) {

    const filePath =
      this.getPath(clientId)

    // GARANTE PASTA
    this.ensureDirectory(filePath)

    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, 2)
    )
  }

  static getSession(clientId, userId) {

    const sessions =
      this.load(clientId)

    if (!sessions[userId]) {

      sessions[userId] = {

        flow: 'assistant',

        step: 'start',

        cart: [],

        data: {},

        createdAt: Date.now()
      }

      this.save(clientId, sessions)
    }

    return sessions[userId]
  }

  static updateSession(
    clientId,
    userId,
    newData
  ) {

    const sessions =
      this.load(clientId)

    sessions[userId] = {

      ...sessions[userId],

      ...newData
    }

    this.save(clientId, sessions)

    return sessions[userId]
  }
}

module.exports = SessionManager