const express = require('express')

const path = require('path')

const cors =
require('cors')





//importando rotas
const ordersRoutes = require('./routes/orders')
const appointmentsRoutes = require('./routes/appointments')
const companiesRoutes = require('./routes/companies')
const companyRoutes = require('./routes/company')
const productRoutes = require('./routes/products')
const companyOrdersRoutes = require('./routes/companyOrders')
//adicionar horarios
const scheduleRoutes = require('./routes/schedule')




//auth
const authRoutes = require('./routes/auth')

//importando rotas diretas



const app = express()

app.use(cors())







app.use(
  express.json()
)


//tentando adicionar react
app.use(express.static(path.join(__dirname, 'dist')));

//add horas
app.use(
  '/api/schedule',
  scheduleRoutes
)

//liberar pastas
app.use(
  '/uploads',
  express.static(
    path.join(__dirname, '../uploads')
  )
)

app.use('/api/products', productRoutes)
//app.use('/api/services', require('./routes/services'))
app.use('/api/services', require('./routes/services'))

app.use('/appointments', require('./routes/appointments'))

//rota dos pedidos


app.use(
  '/company',
  companyRoutes
)

app.use(
  '/auth',
  authRoutes
)

app.use(
  '/companies',
  companiesRoutes
)

app.use('/pedidos', companyOrdersRoutes)

app.use(
  '/appointments',
  appointmentsRoutes
)

app.use(
  '/orders',
  ordersRoutes
)

app.get(
  '/',
  (req, res) => {

    return res.json({

      status: true,

      message:
      'API ONLINE 🚀'

    })

  }
)

app.use((req, res) => {

  res.sendFile(
    path.join(__dirname, 'dist/index.html')
  )

})

module.exports = app