const ClientManager =
require('../core/ClientManager')

const FlowManager =
require('../core/FlowManager')

const Context =
require('../core/Context')

module.exports =
async ({
   clientId,
   sock,
   message
}) => {

   try {

      const client =
      ClientManager.get(clientId)

      if (!client) return

      const ctx =
      new Context({

         sock,

         message,

         client

      })

      //aqui
      // HANDOFF
if (
  ctx.session.handoff
) {

  // ADMIN VOLTAR BOT
  if (

    ctx.sender ===
    ctx.client.config.adminNumber

  ) {

    // COMANDO /BOT
    if (
      ctx.body === '/bot'
    ) {

      ctx.setSession({

        handoff: false,

        flow: 'assistant',

        step: 'start'

      })

      await ctx.reply(
`🤖 Bot reativado com sucesso.`
      )

      return false
    }

  }

  // BOT BLOQUEADO
  return false
}

      //aqui

      // HANDOFF
if (
  ctx.session.handoff
) {

  // VOLTAR BOT
  if (
    ctx.sender ===
    ctx.client.config.adminNumber
  ) {

    if (
      ctx.body.startsWith(
        '/bot'
      )
    ) {

      const target =
      ctx.body.split(' ')[1]

      ctx.setSession({

        handoff: false,

        flow: 'assistant',

        step: 'start'

      })

      await ctx.reply(
        'Bot reativado.'
      )
    }
  }

  return false
}

      if (!ctx.body) return

      const modules =
      client.modules.sort(
         (a, b) =>
            (a.priority || 0) -
            (b.priority || 0)
      )

      for (const module of modules) {

   if (
      !FlowManager.canExecute(
         module,
         ctx
      )
   ) continue

   if (
      module.events?.onMessage
   ) {

      const result =
      await module.events.onMessage(
         ctx
      )

      // GOTO FLOW
      if (ctx.goto) {

         const nextModule =
         modules.find(
            m =>
               m.name === ctx.goto
         )

         if (
            nextModule?.events?.onMessage
         ) {

            ctx.goto = null

            await nextModule
            .events
            .onMessage(ctx)
         }

         break
      }

      // PARA PIPELINE
      if (result === false) {
         break
      }

   }

}

   } catch (err) {

      console.log(
         'Erro no messages handler:',
         err
      )

   }

}