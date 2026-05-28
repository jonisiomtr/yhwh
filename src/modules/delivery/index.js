const fs = require('fs')
const path = require('path')

const NotificationManager =
require('../../managers/NotificationManager')

module.exports = {

  name: 'delivery',

  global: true,

  flow: 'delivery',

  priority: 0,

  events: {

    async onMessage(ctx) {

      // IGNORA
      if (

        !ctx.body
        ?.toLowerCase()
        .startsWith('comprar')

        &&

        ctx.session.flow !==
        'delivery'

      ) {

        return true

      }

      const productsPath =
      path.join(

        __dirname,

        `../../tenants/${ctx.client.id}/products.json`

      )

      if (
        !fs.existsSync(productsPath)
      ) {

        return false
      }

      const products =
      JSON.parse(
        fs.readFileSync(productsPath)
      )

      // INICIAR COMPRA
      if (

        ctx.body
        .toLowerCase()
        .startsWith('comprar')

      ) {

        const parts =
        ctx.body.split(' ')

        const productId =
        Number(parts[1])

        const product =
        products.find(
          p =>
            p.id === productId
        )

        if (!product) {

          await ctx.reply(
            '❌ Produto não encontrado.'
          )

          return false
        }

        ctx.setSession({

          flow: 'delivery',

          step: 'address',

          cart: [product]

        })

        await ctx.reply(
`📍 ENVIO

Digite seu endereço.

Ou envie sua localização atual pelo WhatsApp.`
        )

        return false
      }

      // ENDEREÇO
      if (
        ctx.session.step === 'address'
      ) {

        ctx.setSession({

          address: ctx.body,

          step: 'payment'

        })

        await ctx.reply(
`💳 PAGAMENTO

1 - Dinheiro
2 - Pix`
        )

        return false
      }

      // PAGAMENTO
      if (
        ctx.session.step === 'payment'
      ) {

        let payment = null

        if (
          ctx.body === '1'
        ) {

          payment = 'Dinheiro'
        }

        if (
          ctx.body === '2'
        ) {

          payment = 'Pix'
        }

        if (!payment) {

          await ctx.reply(
            '❌ Opção inválida.'
          )

          return false
        }

        let total = 0

        ctx.session.cart.forEach(
          item => {

            total +=
            Number(item.price)

          }
        )

        

        const order = {

  
  number:
  ctx.sender.replace(
    '@s.whatsapp.net',
    ''
  ),

  cart:
  ctx.session.cart,

  address:
  ctx.session.address,

  payment:
  payment,
  
  status:
  'pending',

  createdAt:
  Date.now()

}

// ENVIA PARA EMPRESA
await NotificationManager.newOrder(

  ctx,

  order

)

// SALVAR NO DATABASE

const databasePath =
path.join(

  __dirname,

  `../../tenants/${ctx.client.id}/database.json`

)

if (

  fs.existsSync(databasePath)

) {

  const database =
  JSON.parse(
    fs.readFileSync(databasePath)
  )

  if (!database.orders) {

    database.orders = []

  }

  database.orders.unshift(order)

  fs.writeFileSync(

    databasePath,

    JSON.stringify(
      database,
      null,
      2
    )

  )

}

// CLIENTE
await ctx.reply(
`✅ PEDIDO REALIZADO

💰 Total:
R$ ${total}

🚚 Seu pedido foi enviado para a empresa.`
)

        ctx.setSession({

          flow: 'assistant',

          step: 'start'

        })

        return false
      }

      return true

    }

  }

}