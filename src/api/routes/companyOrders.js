const express = require('express')
const fs = require('fs')
const path = require('path')

const router = express.Router()

router.get(

  '/listar/orders/:companyId',

  async (req, res) => {

    try {

      const { companyId } =
      req.params

      const databasePath =
      path.join(

        __dirname,

        `../../tenants/${companyId}/database.json`

      )

      if (

        !fs.existsSync(
          databasePath
        )

      ) {

        return res.status(404).json({

          error:
          'Database nao encontrado'

        })

      }

      const database =
      JSON.parse(

        fs.readFileSync(
          databasePath,
          'utf-8'
        )

      )

      return res.json({

        orders:
        database.orders || []

      })

    } catch (err) {

      console.log(err)

      return res.status(500).json({

        error:
        'Erro ao carregar pedidos'

      })

    }

  }

)

//rotas de aceitar e finalizar pedidos
router.put(

  '/companies/orders/:companyId/:orderIndex',

  async (req, res) => {

    try {

      const { companyId, orderIndex } =
      req.params

      const { status } =
      req.body

      const databasePath =
      path.join(

        __dirname,

        `../../tenants/${companyId}/database.json`

      )

      if (

        !fs.existsSync(
          databasePath
        )

      ) {

        return res.status(404).json({

          error:
          'Database não encontrado'

        })

      }

      const database =
      JSON.parse(

        fs.readFileSync(
          databasePath,
          'utf-8'
        )

      )

      if (

        !database.orders[
          orderIndex
        ]

      ) {

        return res.status(404).json({

          error:
          'Pedido não encontrado'

        })

      }

      database.orders[
        orderIndex
      ].status = status

      fs.writeFileSync(

        databasePath,

        JSON.stringify(
          database,
          null,
          2
        )

      )

      return res.json({

        success: true

      })

    } catch (err) {

      console.log(err)

      return res.status(500).json({

        error:
        'Erro ao atualizar pedido'

      })

    }

  }

)


module.exports = router