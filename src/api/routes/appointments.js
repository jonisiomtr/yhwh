const express =
require('express')

const router = express.Router()
const fs = require('fs')
const path = require('path')
const auth = require('../middlewares/auth')

// LISTAR PEDIDOS
router.get('/', auth, (req, res) => {

  let clientId

  // ADMIN
  if (req.user.type === 'admin') {

    clientId = req.query.clientId

  }

  // EMPRESA
  else {

    clientId = req.user.companyId

  }

  if (!clientId) {

    return res.status(400).json({
      error: 'clientId obrigatório'
    })

  }

  const filePath = path.join(
    __dirname,
    `../../tenants/${clientId}/appointments.json`
  )

  // cria se nao existir
  if (!fs.existsSync(filePath)) {

    fs.writeFileSync(
      filePath,
      '[]'
    )

  }

  const appointments = JSON.parse(
    fs.readFileSync(filePath)
  )

  return res.json(appointments)

})

// CANCELAR AGENDAMENTO
router.delete(

  '/:id',

  (req, res) => {

    const clientId =
    req.query.clientId

    const id =
    Number(req.params.id)

    const fs = require('fs')
const path = require('path')

const filePath = path.join(
  __dirname,
  `../../tenants/${clientId}/appointments.json`
)

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, '[]')
}

let appointments = JSON.parse(
  fs.readFileSync(filePath)
)

appointments = appointments.filter(
  appointment =>
    appointment.id !== id
)

fs.writeFileSync(
  filePath,
  JSON.stringify(appointments, null, 2)
)

    return res.json({

      success: true,

      message:
      'Agendamento cancelado.'

    })

  }

)

module.exports =
router