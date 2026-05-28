const QRCode =
require('qrcode')

const express =
require('express')

const router =
express.Router()

const fs =
require('fs')

const path =
require('path')

const auth =
require('../middlewares/auth')


const {
  startClient,
  startingClients
} = require('../../bootstrap/startClient')

const reloadClientModules =
require('../../core/ReloadClientModules')

const ConnectionManager =
require('../../managers/ConnectionManager')

const ClientManager =
require('../../core/ClientManager')

//aqui2 qrcod
const { sessions } = require( '../../store/sessions' )
//

// LISTAR EMPRESAS
router.get(

  '/',

  auth,

  (req, res) => {

    const tenantsPath =
    path.join(

      __dirname,

      '../../tenants'

    )

    const companies =
fs.readdirSync(
  tenantsPath
)

const formatted =

companies.map(
  company => {

    const session =
    sessions[company]

    let status =
    'offline'

    if (
      session?.connected
    ) {

      status =
      'online'

    } else if (
      session?.qr
    ) {

      status =
      'pending'

    }

    return {

      id: company,

      status

    }

  }
)

    return res.json(
  formatted
)

  }

)

// DETALHES EMPRESA
router.get(

  '/:id',

  auth,

  (req, res) => {

    const companyId =
    req.params.id

    const configPath =
    path.join(

      __dirname,

      `../../tenants/${companyId}/config.json`

    )

    if (
      !fs.existsSync(configPath)
    ) {

      return res.status(404)
      .json({

        error:
        'Empresa não encontrada'

      })
    }

    const config =
    JSON.parse(

      fs.readFileSync(
        configPath
      )

    )

    return res.json(
      config
    )

  }

)


// CRIAR EMPRESA
router.post(

  '/',

  auth,

  async (req, res) => {

    // SOMENTE ADMIN
    if (
      req.user.type !==
      'admin'
    ) {

      return res.status(403)
      .json({

        error:
        'Sem permissão'

      })
    }

    const {

  id,

  name,

  password,

  adminNumber

} = req.body

    if (
      !id ||
      !name ||
      !password
    ) {

      return res.status(400)
      .json({

        error:
        'Dados obrigatórios'

      })
    }

    const tenantPath =
    path.join(

      __dirname,

      `../../tenants/${id}`

    )

    // EMPRESA EXISTE
    if (
      fs.existsSync(
        tenantPath
      )
    ) {

      return res.status(400)
      .json({

        error:
        'Empresa já existe'

      })
    }

    // CRIAR PASTA
    fs.mkdirSync(
      tenantPath
    )

    // CONFIG
    fs.writeFileSync(

      path.join(
        tenantPath,
        'config.json'
      ),

      JSON.stringify({

        id,

        name,

        password,

        modules: [

          'assistant'

        ],

        adminNumber:
`${adminNumber.replace(/\D/g, '')}@s.whatsapp.net`

      }, null, 2)

    )

    // DATABASE
    fs.writeFileSync(

      path.join(
        tenantPath,
        'database.json'
      ),

      JSON.stringify({

        orders: [],

        appointments: []

      }, null, 2)

    )

    // PRODUCTS
    fs.writeFileSync(

      path.join(
        tenantPath,
        'products.json'
      ),

      '[]'

    )

    // SERVICES
    fs.writeFileSync(

      path.join(
        tenantPath,
        'services.json'
      ),

      '[]' //base {"id": 1,"name":"cabelo","price": 12}

    )

    // SCHEDULE
fs.writeFileSync(

  path.join(
    tenantPath,
    'schedule.json'
  ),

  JSON.stringify({

    open: '08:00',

    close: '18:00',

    interval: 60

  }, null, 2)

)

    // INICIAR CLIENTE
    // INICIAR CLIENTE (não pode quebrar a criação)
try {
  await startClient(id)
} catch (err) {
  console.log('StartClient falhou, mas empresa foi criada:', err.message)
}

    return res.json({

      success: true,

      message:
      'Empresa criada com sucesso.'

    })

  }

)

/*

//111
// QR CODE
router.get(

  '/:id/qr',

  auth,

  (req, res) => {

    const companyId =
    req.params.id

    const connection =
    ConnectionManager.get(
      companyId
    )

    if (!connection) {

      return res.status(404)
      .json({

        error:
        'Conexão não encontrada'

      })
    }

    return res.json({

      connected:
      connection.connected,

      qr:
      connection.qr || null

    })

  }

)

*/

router.put(

  '/:id/modules',

  auth,

  (req, res) => {

    const companyId =
    req.params.id

    const { modules } =
    req.body

    const configPath =
    path.join(

      __dirname,

      `../../tenants/${companyId}/config.json`

    )

    if (
      !fs.existsSync(configPath)
    ) {

      return res.status(404)
      .json({

        error:
        'Empresa não encontrada'

      })

    }

    const config =
    JSON.parse(

      fs.readFileSync(
        configPath
      )

    )

    config.modules =
    modules

    fs.writeFileSync(

      configPath,

      JSON.stringify(
        config,
        null,
        2
      )

    )

global.restartingClients[companyId] = true

reloadClientModules(companyId)

    return res.json({

      success: true

    })

  }

)

router.get(

  '/:id/qr',

  auth,

  (req, res) => {

    const companyId =
    req.params.id

    const session =
    sessions[companyId]

    if (!session) {

  return res.json({

    connected: false,
    qr: null,
    pairingCode: null

  })

}

    if (session.connected) {

      return res.json({

        connected: true

      })

    }

    //aqui manda qr
    
    if (!session.qr) {

  return res.json({

    connected: false,
    qr: null,
    pairingCode:
    session?.pairingCode || null

  })

}

QRCode.toDataURL(

  session.qr,

  (err, url) => {

    return res.json({

  connected: false,

  qr: url,

  pairingCode:
  session?.pairingCode || null

})

  }

)

  }

)


//DELETAR EMPRESA

router.delete('/:id', auth, (req, res) => {

  try {

    // SOMENTE ADMIN
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        error: 'Sem permissão'
      })
    }

    const companyId = req.params.id

    const tenantPath = path.join(
      __dirname,
      `../../tenants/${companyId}`
    )

    const sessaoDocliente = path.join(
      __dirname,
      `../../../sessions/${companyId}`
    )

    // VERIFICA SE EXISTE
    if (!fs.existsSync(tenantPath)) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      })
    }

    // REMOVE PASTA (DELETE TOTAL DA EMPRESA)
    fs.rmSync(tenantPath, {
      recursive: true,
      force: true
    })

    

    return res.json({
      success: true,
      message: 'Empresa removida com sucesso'
    })

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: 'Erro ao remover empresa'
    })

  }

})


//rota para ler o modulos do const
// BUSCAR MODULOS DA EMPRESA
router.get(
  '/modules/:companyId',

  async (req, res) => {

    try {

      const { companyId } =
      req.params

      const configPath =
      path.join(

        __dirname,

        `../../tenants/${companyId}/config.json`

      )

      // VERIFICA SE EXISTE
      if (
        !fs.existsSync(configPath)
      ) {

        return res.status(404).json({

          error:
          'Empresa não encontrada'

        })

      }

      // LER CONFIG
      const config =
      JSON.parse(

        fs.readFileSync(
          configPath,
          'utf-8'
        )

      )

      return res.json({

        modules:
        config.modules || []

      })

    } catch (err) {

      console.log(err)

      return res.status(500).json({

        error:
        'Erro ao carregar módulos'

      })

    }

  }
)

//rota qr
// GERAR PAIRING CODE MANUAL
// GERAR PAIRING CODE
router.post( '/:id/pairing-code',
auth,
  async (req, res) => {
    try {
      const companyId =
      req.params.id

      const {
        phoneNumber
      } = req.body

      if (!phoneNumber) {

        return res.status(400)
        .json({

          error:
          'Número obrigatório'

        })

      }

      const configPath =
      path.join(

        __dirname,

        `../../tenants/${companyId}/config.json`

      )

      if (
        !fs.existsSync(configPath)
      ) {

        return res.status(404)
        .json({

          error:
          'Empresa não encontrada'

        })

      }

      // LER CONFIG
      const config =
      JSON.parse(

        fs.readFileSync(
          configPath,
          'utf-8'
        )

      )

      // SALVAR NUMERO
      config.phoneNumber =
      phoneNumber
      .replace(/\D/g, '')

      fs.writeFileSync(

        configPath,

        JSON.stringify(
          config,
          null,
          2
        )

      )

      // DESTROI CLIENTE ANTIGO
      

      // LIMPA SESSION TEMP
      startingClients[companyId] = false
      


      // REMOVE SESSION BAILEYS ANTIGA
      const existing =
global.clientSockets[companyId]

if (existing) {

  try {

    existing.ev.removeAllListeners()

  } catch {}

  try {

    existing.ws.close()

  } catch {}

  delete global.clientSockets[companyId]

}


      // REINICIA CLIENTE
      startClient(companyId)

let responded = false

const interval = setInterval(() => {

  if (
    sessions[companyId]?.pairingCode &&
    !responded
  ) {

    responded = true

    clearInterval(interval)

    clearTimeout(timeout)

    return res.json({

      success: true,

      pairingCode:
      sessions[companyId].pairingCode

    })

  }

}, 1000)

const timeout = setTimeout(() => {

  if (responded) return

  responded = true

  clearInterval(interval)

  return res.status(500).json({

    error:
    'Timeout ao gerar pairing code'

  })

}, 20000)

    } catch (err) {

      console.log(err)

      return res.status(500)
      .json({

        error:
        'Erro ao gerar pairing code'

      })

    }

  }

)

router.post(
  '/:id/clear-pairing',
  auth,
  async (req, res) => {

    try {

      const companyId =
      req.params.id

      const configPath =
      path.join(
        __dirname,
        `../../tenants/${companyId}/config.json`
      )

      if (!fs.existsSync(configPath)) {

        return res.status(404).json({

          error:
          'Empresa não encontrada'

        })

      }

      const config =
      JSON.parse(
        fs.readFileSync(
          configPath,
          'utf-8'
        )
      )

      // REMOVE NUMERO
      delete config.phoneNumber

      fs.writeFileSync(

        configPath,

        JSON.stringify(
          config,
          null,
          2
        )

      )

      // RESTART SOCKET
      startingClients[companyId] = false

      const existing =
      global.clientSockets[companyId]

      if (existing) {

        try {

          existing.ev.removeAllListeners()

        } catch {}

        try {

          existing.ws.close()

        } catch {}

        delete global.clientSockets[companyId]

      }

      startClient(companyId)

      return res.json({

        success: true

      })

    } catch (err) {

      console.log(err)

      return res.status(500).json({

        error:
        'Erro ao limpar pairing'

      })

    }

  }
)


module.exports =
router