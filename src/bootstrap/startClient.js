const fs = require('fs')
const path = require('path')
const pino = require('pino')
const QRCode = require('qrcode-terminal')
const PQueue = require('p-queue').default





global.restartingClients = {}
global.clientSockets = {}

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys')

const { Boom } =
require('@hapi/boom')

const ClientManager =
require('../core/ClientManager')

const handleMessage =
require('../handlers/messages')

const loadModules =
require('../core/ModuleLoader')

const ConnectionManager =
require('../managers/ConnectionManager')

const { sessions } =
require('../store/sessions')

const startingClients = {}

global.messageQueues = {}

function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  )

}



async function startClient(clientId) {

  const existing =
global.clientSockets[clientId]

if (existing) {

  try {

    existing.ev.removeAllListeners()

  } catch {}

  try {

    existing.ws.close()

  } catch {}

  delete global.clientSockets[clientId]

  console.log(
    `🧹 Socket antigo removido ${clientId}`
  )

}

  if (!global.messageQueues[clientId]) {

    global.messageQueues[clientId] =
    new PQueue({

      concurrency: 1

    })

  }

  const oldClient =
  ClientManager.get(clientId)

  // DESTROI SOCKET ANTIGO
  if (oldClient?.sock) {

    global.restartingClients[clientId] = true

    try {

      oldClient.sock.ev.removeAllListeners()

    } catch {}

    try {

      oldClient.sock.ws.close()

    } catch {}

    console.log(
      `🧹 Socket antigo destruído: ${clientId}`
    )

  }

  // EVITA DUPLO START
  if (
    startingClients[clientId]
  ) {

    console.log(
      `⏳ ${clientId} já está iniciando`
    )

    return
  }

  startingClients[clientId] = true

  try {

    const configPath =
    path.join(
      __dirname,
      `../tenants/${clientId}/config.json`
    )

    if (
      !fs.existsSync(configPath)
    ) {

      console.log(
        `❌ Config não encontrada: ${clientId}`
      )

      startingClients[
        clientId
      ] = false

      return
    }

    const config =
    JSON.parse(
      fs.readFileSync(
        configPath,
        'utf-8'
      )
    )

    // CARREGA MODULOS
    const modules =
    loadModules(
      config.modules || []
    )

    const sessionPath =
    path.join(
      __dirname,
      `../../sessions/${clientId}`
    )

   



    const {
      state,
      saveCreds
    } =
    await useMultiFileAuthState(
      sessionPath
    )

    const { version } =
    await fetchLatestBaileysVersion()

    const sock =
    makeWASocket({

      version,

      auth: state,

      logger: pino({
        level: 'silent'
      }),

      //browser: Browsers.macOS('Desktop'),

      /*browser: [
  'Chrome (Linux)',
  '',
  ''
],*/

      /*

      browser: [
        'Ubuntu',
        'Chrome',
        '120.0.0'
      ],*/

      /*browser: [
  'Ubuntu',
  'Chrome',
  '20.0.04'
],*/

browser: [
  'Windows',
  'Chrome',
  '120.0.0'
],


      printQRInTerminal: false,

      syncFullHistory: false,

      markOnlineOnConnect: false,

      defaultQueryTimeoutMs: 60000,

      connectTimeoutMs: 60000,

      keepAliveIntervalMs: 10000,

      retryRequestDelayMs: 250,

      generateHighQualityLinkPreview: false,

    })

    global.clientSockets[clientId] = sock

    let pairingCodeRequested = false
    let reconnectTimer = null

    const ensureSession = () => {
      if (!sessions[clientId]) {
        sessions[clientId] = {}
      }
    }

    const generatePairingCode = async () => {
      if (!config.phoneNumber) return
      if (state.creds?.registered) return
      if (pairingCodeRequested) return

      pairingCodeRequested = true

      try {
        console.log(
          `📲 Gerando pairing code: ${clientId}`
        )

        await sleep(5000)

        const code = await sock.requestPairingCode(
          config.phoneNumber
        )

        console.log(
          `🔗 Pairing Code ${clientId}: ${code}`
        )

        ensureSession()
        sessions[clientId].pairingCode = code

        global.io.emit('connection-update', {
          clientId,
          connected: false,
          pairingCode: code
        })
      } catch (err) {
        pairingCodeRequested = false
        console.log(
          `❌ Pairing Error ${clientId}:`,
          err
        )
      }
    }

    // SALVAR CREDS
    sock.ev.on(
  'creds.update',
  async () => {

    try {

      await saveCreds()

      console.log(
        `💾 Credenciais salvas: ${clientId}`
      )

    } catch (err) {

      console.log(
        `❌ Erro salvando creds: ${clientId}`,
        err
      )

    }

  }
)

    // CONEXAO
    sock.ev.on(
      'connection.update',
      async (update) => {

        

        const {
          connection,
          qr,
          lastDisconnect
        } = update

        if (
  connection === 'close'
) {

}



        // QR CODE
        if (
  qr &&
  !config.phoneNumber
) {

    
          console.log(`\n========================`)
          console.log(`QR CODE: ${clientId}`)
          console.log(`========================\n`)

          QRCode.generate(qr, {
            small: true
          })

          if (!sessions[clientId]) {

  sessions[clientId] = {}

}

sessions[clientId].qr = qr

          global.io.emit('connection-update', {

            clientId,
            qr,
            connected: false

          })

        }

        // CONNECTING
        if (
          connection === 'connecting' &&
          config.phoneNumber &&
          !state.creds.registered
        ) {
          setTimeout(() => {
            generatePairingCode()
          }, 3000)
        }

        // CONECTADO
        if (
          connection === 'open'
        ) {
          if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
          }
        

          

          ensureSession()
          delete sessions[clientId].pairingCode
          sessions[clientId].client = sock

          await saveCreds()

          sessions[clientId].connected = true
          sessions[clientId].qr = null

          ConnectionManager.set(

            clientId,

            {

              qr: null,
              connected: true,
              sock

            }

          )

          global.io.emit('connection-update', {

            clientId,
            qr: null,
            connected: true

          })

          startingClients[
            clientId
          ] = false

          console.log(
            `✅ ${clientId} conectado`
          )

          ClientManager.add(

            clientId,

            {

              id: clientId,
              sock,
              config,
              modules

            }

          )

        }

        

        // DESCONECTOU
        if (
          connection === 'close'
        ) {

          if (sessions[clientId]) {

            delete sessions[clientId].pairingCode

          }

          global.io.emit('connection-update', {

            clientId,
            qr: null,
            connected: false

          })

          const statusCode =
          new Boom(
            lastDisconnect?.error
          ).output?.statusCode

          console.log(
            `❌ ${clientId} desconectado`
          )

          ConnectionManager.remove(
            clientId
          )

          startingClients[
            clientId
          ] = false

          // RESTART MANUAL
          if (
            global.restartingClients[clientId]
          ) {

            console.log(
              `♻️ Reinício manual detectado: ${clientId}`
            )

            delete global.restartingClients[
              clientId
            ]

            return
          }

          // LOGOUT
          if (
  statusCode === DisconnectReason.loggedOut
) {

  console.log(
    `⚠️ Sessão desconectada ${clientId}`
  )

  try {

    fs.rmSync(sessionPath, {
      recursive: true,
      force: true
    })

  } catch {}

  delete sessions[clientId]

  ClientManager.remove(clientId)

  ConnectionManager.remove(clientId)

  startingClients[clientId] = false

  setTimeout(() => {

    startClient(clientId)

  }, 5000)

  return

}



          console.log(
            `🔄 Reconectando ${clientId} em 5 segundos...`
          )

          setTimeout(() => {

            startClient(clientId)

          }, 5000)

        }

      }
    )

    // MENSAGENS
    sock.ev.on(
      'messages.upsert',
      async ({ messages, type }) => {

        try {

          if (
            type !== 'notify'
          ) return

          const message =
          messages[0]

          if (!message) return

          if (!message.message) return

          if (message.key.fromMe) return

          // IGNORA STATUS
          if (
            message.key.remoteJid ===
            'status@broadcast'
          ) return

          // IGNORA MENSAGEM VAZIA
          if (
            !Object.keys(
              message.message
            ).length
          ) return

          await global.messageQueues[clientId].add(
            async () => {

              await sleep(500)

              await handleMessage({

                clientId,
                sock,
                message,
                config

              })

              await sleep(250)

            }
          )

        } catch (err) {

          console.log(
            '❌ Erro mensagem:',
            err
          )

        }

      }
    )

    console.log(
      `🚀 Inicializando ${clientId}`
    )

  } catch (err) {

    startingClients[
      clientId
    ] = false

    console.log(
      `❌ Erro ao iniciar ${clientId}`,
      err
    )

  }

}

module.exports = {
  startClient,
  startingClients
}