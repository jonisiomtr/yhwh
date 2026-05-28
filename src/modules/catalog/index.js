const fs = require('fs')
const path = require('path')

module.exports = {

  name: 'catalog',

  flow: 'catalog',

  priority: 2,

  menu: {

    label: 'Catálogo'

  },

  events: {

    async onMessage(ctx) {

      // ====================================
      // IGNORA DELIVERY
      // ====================================
      if (

        ctx.body
        ?.toLowerCase()
        .startsWith('comprar')

      ) {

        return true

      }

      const productsPath =
      path.join(

        __dirname,

        `../../tenants/${ctx.client.id}/products.json`

      )

      // SEM PRODUTOS
      // SEM ARQUIVO DE PRODUTOS
if (
  !fs.existsSync(productsPath)
) {

  await ctx.reply(
`🛍️ Esta empresa ainda não cadastrou produtos.`
  )

  ctx.setSession({

    flow: 'assistant',
    step: 'start'

  })

  return false
}

      const products =
      JSON.parse(
        fs.readFileSync(productsPath)
      )

      // SEM PRODUTOS CADASTRADOS
if (
  !products.length
) {

  await ctx.reply(
`🛍️ Esta empresa ainda não cadastrou produtos.`
  )

  ctx.setSession({

    flow: 'assistant',
    step: 'start'

  })

  return false
}

      // NORMALIZAR TEXTO
      const normalize =
      text =>

        text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      // SOMENTE ATIVOS
      const activeProducts =
      products.filter(
        product =>
          product.active !== false
      )

      // MENU
      async function sendMenu() {

        await ctx.reply(
`🛍️ CATÁLOGO

1 - Ver produtos
2 - Pesquisar produto

0 - Voltar`
        )

      }

      // INICIO
      if (
        ctx.session.step === 'start'
      ) {

        await sendMenu()

        ctx.setSession({

          step: 'menu'

        })

        return false
      }

      // MENU
      if (
        ctx.session.step === 'menu'
      ) {

        if (
          ctx.body === '0'
        ) {

          ctx.setSession({

            flow: 'assistant',

            step: 'start'

          })

          await ctx.reply(
            '🔙 Voltando ao menu inicial...'
          )

          return false
        }

        // PRODUTOS
        if (
          ctx.body === '1'
        ) {

          if (
            activeProducts.length === 0
          ) {

            await ctx.reply(
              'Nenhum produto disponível.'
            )

            return false
          }

          let text =
`🛍️ PRODUTOS

`

          activeProducts.forEach(
            product => {

              text +=
`${product.id} - ${product.name}

💰 R$ ${product.price}

`

            }
          )

          text +=
`Digite o número do produto.

0 - Voltar`

          await ctx.reply(text)

          ctx.setSession({

            step: 'details',

            products:
            activeProducts

          })

          return false
        }

        // PESQUISAR
        if (
          ctx.body === '2'
        ) {

          await ctx.reply(
`🔎 Digite o nome do produto.

Exemplo:
Açaí`
          )

          ctx.setSession({

            step: 'search'

          })

          return false
        }

        await ctx.reply(
`❌ Opção inválida.

Escolha uma opção válida.`
        )

        await sendMenu()

        return false
      }

      // PESQUISA
      if (
        ctx.session.step === 'search'
      ) {

        const search =
        normalize(
          ctx.body.trim()
        )

        const foundProducts =
        activeProducts.filter(
          product =>

            normalize(
              product.name
            ).includes(search)
        )

        if (
          foundProducts.length === 0
        ) {

          await ctx.reply(
`❌ Nenhum produto encontrado.

1 - Tentar novamente
2 - Ver todos os produtos
0 - Voltar`
          )

          ctx.setSession({

            step: 'search_not_found'

          })

          return false
        }

        let text =
`🔎 RESULTADOS

`

        foundProducts.forEach(
          product => {

            text +=
`${product.id} - ${product.name}

💰 R$ ${product.price}

`

          }
        )

        text +=
`Digite o número do produto.

0 - Voltar`

        await ctx.reply(text)

        ctx.setSession({

          step: 'details',

          products:
          foundProducts

        })

        return false
      }

      // SEARCH NOT FOUND
      if (
        ctx.session.step ===
        'search_not_found'
      ) {

        if (
          ctx.body === '1'
        ) {

          ctx.setSession({

            step: 'search'

          })

          await ctx.reply(
            '🔎 Digite o nome do produto.'
          )

          return false
        }

        if (
          ctx.body === '2'
        ) {

          let text =
`🛍️ PRODUTOS

`

          activeProducts.forEach(
            product => {

              text +=
`${product.id} - ${product.name}

💰 R$ ${product.price}

`

            }
          )

          text +=
`Digite o número do produto.

0 - Voltar`

          await ctx.reply(text)

          ctx.setSession({

            step: 'details',

            products:
            activeProducts

          })

          return false
        }

        if (
          ctx.body === '0'
        ) {

          ctx.setSession({

            step: 'menu'

          })

          await sendMenu()

          return false
        }

        return false
      }

      // =========================
// COMPRAR PRODUTO
// =========================
if (
  ctx.session.step ===
  'buy_product'
) {

  // VOLTAR
  if (
    ctx.body === '0'
  ) {

    ctx.setSession({

      step: 'menu'

    })

    await sendMenu()

    return false
  }

  // COMPRAR
  if (
    ctx.body === '1'
  ) {

    ctx.setSession({

      flow: 'delivery',

      step: 'address',

      cart: [

        ctx.session.selectedProduct

      ]

    })

    await ctx.reply(
`📍 ENVIO

Digite seu endereço.

Ou envie sua localização atual pelo WhatsApp.`
    )

    return false
  }

  await ctx.reply(
`❌ Opção inválida.

1 - Comprar
0 - Voltar`
  )

  return false
}

      // DETAILS
      if (
        ctx.session.step === 'details'
      ) {

        if (
          ctx.body === '0'
        ) {

          ctx.setSession({

            step: 'menu'

          })

          await sendMenu()

          return false
        }

        const product =
        ctx.session.products.find(
          p =>
            p.id === Number(ctx.body)
        )

        if (!product) {

          await ctx.reply(
`❌ Produto inválido.

Digite um número válido.`
          )

          return false
        }

        let text =
`🛍️ ${product.name}

💰 Preço:
R$ ${product.price}

📝 Descrição:
${product.description || 'Não informado'}

`

        const hasDelivery =
ctx.client.modules.some(
  module =>
    module.name === 'delivery'
)

        if (hasDelivery) {

          text +=
`🛒 O que deseja fazer?

1 - Comprar
0 - Voltar`

        } else {

          text +=
`📞 Esta empresa utiliza apenas catálogo.

Consulte a empresa para realizar compras.`

        }

        await ctx.reply(text)

// TEM DELIVERY
if (hasDelivery) {

  ctx.setSession({

    step: 'buy_product',

    selectedProduct: product

  })

} else {

  // FINALIZA CATÁLOGO
  ctx.setSession({

    flow: 'assistant',

    step: 'start'

  })

}

return false
      }


    }

  }

}