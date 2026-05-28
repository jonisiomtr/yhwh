const express =
require('express')

const router = express.Router()
const Database = require('../../database/Database')
const auth = require('../middlewares/auth')

// LISTAR PEDIDOS
router.get(
  '/',
  auth,

  (req, res) => {

    let clientId

// ADMIN
if (
  req.user.type ===
  'admin'
) {

  clientId =
  req.query.clientId

}

// EMPRESA
else {

  clientId =
  req.user.companyId

}

    if (!clientId) {

      return res.status(400)
      .json({

        error:
        'clientId obrigatório'

      })
    }

    const orders =
    Database.all(
      clientId,
      'orders'
    )

    return res.json(
      orders
    )

  }
)

module.exports =
router