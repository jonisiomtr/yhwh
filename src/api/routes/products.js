const express = require('express')

const fs = require('fs')

const path = require('path')

const auth = require('../middlewares/auth')

const router = express.Router()

// =========================
// GET FILE
// =========================
function getFile(companyId) {

  const filePath = path.join(

    __dirname,

    `../../tenants/${companyId}/products.json`

  )

  if (!fs.existsSync(filePath)) {

    fs.writeFileSync(
      filePath,
      '[]'
    )

  }

  return filePath

}

// =========================
// LISTAR
// =========================
router.get('/', auth, (req, res) => {

  const companyId =
  req.user.companyId

  const filePath =
  getFile(companyId)

  const products =
  JSON.parse(
    fs.readFileSync(filePath)
  )

  res.json(products)

})

// =========================
// ADD PRODUTO
// =========================
router.post('/', auth, (req, res) => {

  const companyId =
  req.user.companyId

  const {

    code,

    name,

    description,

    price,

    stock,

    image

  } = req.body

  const filePath =
  getFile(companyId)

  const products =
  JSON.parse(
    fs.readFileSync(filePath)
  )

  // =========================
  // GERAR ID
  // =========================
  const nextId =

    products.length > 0

    ? Math.max(
        ...products.map(
          p => p.id
        )
      ) + 1

    : 1

  // =========================
  // GERAR CODE
  // =========================
  const productCode =

    code && code !== ''

    ? code

    : String(nextId)

  // =========================
  // VERIFICA CODIGO
  // =========================
  const existing =
  products.find(

    p => p.code === productCode

  )

  // =========================
  // SE EXISTIR
  // =========================
  if (existing) {

    existing.stock +=
    Number(stock || 1)

    fs.writeFileSync(

      filePath,

      JSON.stringify(
        products,
        null,
        2
      )

    )

    return res.json(products)

  }

  // =========================
  // NOVO PRODUTO
  // =========================
  const newProduct = {

    id: nextId,

    code: productCode,

    name,

    description:
    description || '',

    price:
    Number(price),

    stock:
    Number(stock || 1),

    image:
    image || '',

    active: true,

    createdAt:
    Date.now()

  }

  products.push(newProduct)

  fs.writeFileSync(

    filePath,

    JSON.stringify(
      products,
      null,
      2
    )

  )

  res.json(products)

})

// =========================
// DELETE
// =========================
router.delete('/:id', auth, (req, res) => {

  const companyId =
  req.user.companyId

  const filePath =
  getFile(companyId)

  const products =
  JSON.parse(
    fs.readFileSync(filePath)
  )

  const updated =
  products.filter(

    p =>

      p.id !==
      Number(req.params.id)

  )

  fs.writeFileSync(

    filePath,

    JSON.stringify(
      updated,
      null,
      2
    )

  )

  res.json(updated)

})

module.exports = router