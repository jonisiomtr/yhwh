const fs = require('fs')
const path = require('path')

//logs
const Logger = require('./core/logger/Logger')

//api Server Painel
const api = require('./api/server')

//atualizado
const http = require('http')
const { Server } = require('socket.io')

const server = http.createServer(api)

const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

global.io = io



Logger.info(
  'Sistema iniciado'
)

//const startClient =
//require('./bootstrap/startClient')
const {
  startClient,
  startingClients
} = require('./bootstrap/startClient')

//funcao para criar empresas
async function createTenant(data) {

  const tenantPath =
  path.join(
    __dirname,
    `tenants/${data.id}`
  )

  if (!fs.existsSync(tenantPath)) {

    fs.mkdirSync(tenantPath, {
      recursive: true
    })

  }

  // PRODUTOS
  fs.writeFileSync(
    `${tenantPath}/products.json`,
    JSON.stringify([], null, 2)
  )

  // SERVIÇOS
  fs.writeFileSync(
    `${tenantPath}/services.json`,
    JSON.stringify([], null, 2)
  )

  // PEDIDOS
  fs.writeFileSync(
    `${tenantPath}/orders.json`,
    JSON.stringify([], null, 2)
  )

  // AGENDAMENTOS
  fs.writeFileSync(
    `${tenantPath}/appointments.json`,
    JSON.stringify([], null, 2)
  )

  await startClient(data.id)

}

async function start() {

  const tenantsPath =
  path.join(__dirname, 'tenants')

  const clients =
  fs.readdirSync(tenantsPath)
  .filter(file => {

    const fullPath =
    path.join(
      tenantsPath,
      file
    )

    return fs.lstatSync(
      fullPath
    ).isDirectory()

  })

  for (const clientId of clients) {

    await startClient(clientId)

  }

}

start()

const PORT =
process.env.PORT || 3000

api.listen(PORT, () => {

  console.log(
    `🌐 API ONLINE ${PORT}`
  )

})