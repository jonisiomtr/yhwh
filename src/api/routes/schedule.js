const express = require('express')
const fs = require('fs')
const path = require('path')

const auth = require('../middlewares/auth')

const router = express.Router()

// =========================
// GET HORÁRIOS
// =========================
router.get('/', auth, (req, res) => {

  const companyId = req.user.companyId

  const filePath = path.join(
    __dirname,
    `../../tenants/${companyId}/schedule.json`
  )

  // CRIA PADRÃO
  if (!fs.existsSync(filePath)) {

    fs.writeFileSync(

      filePath,

      JSON.stringify({
        open: '08:00',
        close: '18:00',
        interval: 60
      }, null, 2)

    )

  }

  const schedule = JSON.parse(
    fs.readFileSync(filePath)
  )

  res.json(schedule)

})

// =========================
// SALVAR HORÁRIOS
// =========================
router.post('/', auth, (req, res) => {

  const companyId = req.user.companyId

  const {
    open,
    close,
    interval
  } = req.body

  const filePath = path.join(
    __dirname,
    `../../tenants/${companyId}/schedule.json`
  )

  const schedule = {
    open,
    close,
    interval
  }

  fs.writeFileSync(
    filePath,
    JSON.stringify(schedule, null, 2)
  )

  res.json(schedule)

})

module.exports = router