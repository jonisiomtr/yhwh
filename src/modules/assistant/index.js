module.exports = {

  name: 'assistant',

  flow: 'assistant',

  priority: 1,

  events: {

    async onMessage(ctx) {

      // IGNORA DELIVERY
if (

  ctx.body
  ?.toLowerCase()
  .startsWith('comprar')

) {

  return true

}

      

      const message =
      ctx.body
      .toLowerCase()
      .trim()

      // COMANDOS PARA VOLTAR AO MENU
      const resetCommands = [

        'menu',
        'inicio',
        'início',
        'oi',
        'ola',
        'olá',
        'voltar',
        '0'

      ]

      // RESETAR MENU
      if (
        resetCommands.includes(message)
      ) {

        ctx.setSession({

          flow: 'assistant',

          step: 'start'

        })

      }

      // SESSÃO VAZIA
      if (
        !ctx.session.step
      ) {

        ctx.setSession({

          flow: 'assistant',

          step: 'start'

        })

      }

      // INICIO
      if (
        ctx.session.step === 'start'
      ) {

        let text =
`Olá, seja bem-vindo à ${ctx.client.config.name} 🏪

Escolha uma opção abaixo:

`

        const menuModules =

        ctx.client.modules.filter(
          module =>
            module.menu
        )

        menuModules.forEach(
          (module, index) => {

            text +=
`${index + 1} - ${module.menu.label}
`

          }
        )

        text +=
`9 - Falar com atendente`


        await ctx.reply(text)

        ctx.setSession({

          flow: 'assistant',

          step: 'menu'

        })

        return false
      }

      // MENU
      if (
        ctx.session.step === 'menu'
      ) {

        // ATENDIMENTO HUMANO
        if (
          ctx.body === '9'
        ) {

          await ctx.sock.sendMessage(

            ctx.client.config.adminNumber,

            {

              text:
`👨‍💼 NOVO ATENDIMENTO HUMANO

Cliente:
${ctx.pushname}

wa.me/${
ctx.sender.split('@')[0]
}`

            }

          )

          ctx.setSession({

            handoff: true

          })

          await ctx.reply(
`👨‍💼 Você foi transferido para um atendente.

Aguarde um momento.`
          )

          return false
        }

        const menuModules =

        ctx.client.modules.filter(
          module =>
            module.menu
        )

        const selectedModule =
        menuModules[
          Number(ctx.body) - 1
        ]

        // OPÇÃO INVÁLIDA
        if (!selectedModule) {

          await ctx.reply(
`😅 Não entendi sua mensagem.

Vou te mostrar o menu novamente.`
          )

          ctx.setSession({

            flow: 'assistant',

            step: 'start'

          })

          return false
        }

        // ENTRAR NO MÓDULO
        ctx.gotoFlow(
          selectedModule.name
        )

        return false
      }

    }

  }

}