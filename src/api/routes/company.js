const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const router = express.Router()

const upload = multer({

  dest: path.join(
    __dirname,
    '../../uploads'
  )

})

//rota para pegar os dados da empresa, com nome imagem
// PEGAR CONFIGURAÇÕES
router.get(
  '/:companyId',
  async (req, res) => {

    try {

      const { companyId } =
      req.params

      const configPath =
      path.join(
        __dirname,
        `../../tenants/${companyId}/config.json`
      )

      if (
        !fs.existsSync(configPath)
      ) {

        return res.status(404).json({

          error:
          'Empresa não encontrada'

        })

      }

      const config =
      JSON.parse(

        fs.readFileSync(
          configPath,
          'utf8'
        )

      )

      res.json(config)

    } catch (err) {

      console.log(err)

      res.status(500).json({

        error:
        'Erro interno'

      })

    }

  }
)



//

// CONFIGURAÇÕES

//imagen rota
router.post(
  '/settings',
  upload.single('logo'),
  async (req, res) => {

    try {

      const {
        companyId,
        displayName
      } = req.body

      const configPath =
      path.join(
        __dirname,
        `../../tenants/${companyId}/config.json`
      )

      if (
        !fs.existsSync(configPath)
      ) {

        return res.status(404).json({
          error: 'Empresa não encontrada'
        })

      }
      const config = JSON.parse(
        fs.readFileSync(configPath)
      )

      // NOME VISUAL
      config.displayName =
      displayName

      // LOGO
      if (req.file) {

        config.logo =
        `/uploads/${req.file.filename}`

      }

      fs.writeFileSync(
        configPath,
        JSON.stringify(config, null, 2)
      )

      res.json({
        success: true,
        config
      })

    } catch (err) {

      console.log(err)

      res.status(500).json({
        error: 'Erro interno'
      })

    }

  }
)

//senha rota
// ALTERAR SENHA
router.post(
  '/password',
  async (req, res) => {

    try {

      const {
        companyId,
        password
      } = req.body

      const configPath =
      path.join(
        __dirname,
        `../../tenants/${companyId}/config.json`
      )

      if (
        !fs.existsSync(configPath)
      ) {

        return res.status(404).json({

          error:
          'Empresa não encontrada'

        })

      }

      const config =
      JSON.parse(

        fs.readFileSync(
          configPath,
          'utf8'
        )

      )

      // NOVA SENHA
      config.password =
      password

      fs.writeFileSync(

        configPath,

        JSON.stringify(
          config,
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
        'Erro interno'

      })

    }

  }
)

module.exports = router