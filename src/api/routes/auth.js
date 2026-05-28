const express =
require('express')

const router =
express.Router()

const fs =
require('fs')

const path =
require('path')

const jwt =
require('../auth/jwt')

// LOGIN
router.post(

  '/login',

  (req, res) => {

    const {

      username,

      password

    } = req.body

    // ADMIN
    if (

      username === 'admin' &&
      password === '123'

    ) {

      const token =
      jwt.generate({

        type: 'admin'

      })

      return res.json({

        success: true,

        token

      })

    }

    // EMPRESA
    const configPath =
    path.join(

      __dirname,

      `../../tenants/${username}/config.json`

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

    if (
      config.password !== password
    ) {

      return res.status(401)
      .json({

        error:
        'Senha inválida'

      })
    }

    const token =
    jwt.generate({

      type: 'company',

      companyId:
      username

    })

    return res.json({

      success: true,

      token

    })

  }

)

module.exports =
router