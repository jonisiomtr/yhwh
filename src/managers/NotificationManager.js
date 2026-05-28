class NotificationManager {

  // ENVIAR MENSAGEM
  static async send(
    sock,
    to,
    text
  ) {

    if (!to) return

    await sock.sendMessage(

      to,

      {
        text
      }

    )
  }

  // FORMATAR DINHEIRO
  static formatMoney(value) {

    return Number(value)
      .toFixed(2)
      .replace('.', ',')

  }

  // NOVO PEDIDO
  static async newOrder(
    ctx,
    order
  ) {

    const admin =
    ctx.client.config.adminNumber

    if (!admin) return

    let soma = 0

    let itens = ''

    order.cart.forEach(
      (item, index) => {

        soma +=
        Number(item.price)

        itens +=
`${index + 1} - ${item.name}

💰 R$ ${this.formatMoney(item.price)}

`
      }
    )

    // ENDEREÇO
    let endereco = ''

    // TEXTO
    if (
      order.address.type ===
      'text'
    ) {

      endereco =
      order.address.value

    }

    // LOCALIZAÇÃO
    if (
      order.address.type ===
      'location'
    ) {

      endereco =
`📍 Localização enviada

Latitude:
${order.address.latitude}

Longitude:
${order.address.longitude}`
    }

    const text =
`🛒 NOVO PEDIDO

👤 Cliente:
${ctx.pushname}

📞 Número:
wa.me/${
ctx.sender.split("@")[0]
}

====================

🛍️ ITENS:

${itens}

====================

📍 Endereço:
${endereco}

💳 Pagamento:
${order.payment}

💵 TOTAL:
R$ ${this.formatMoney(soma)}
`

//TEMPO PARA IMPEDIR O AGUARDANDO MENSAGEM

   setTimeout(async () => {

  try {

    await this.send(

      ctx.sock,

      admin,

      text

    )

  } catch (err) {

    console.log(
      'Erro ao notificar admin:',
      err
    )

  }

}, 1500)
  }

  // NOVO AGENDAMENTO
  static async newAppointment(
    ctx,
    appointment
  ) {

    const admin =
    ctx.client.config.adminNumber

    if (!admin) return

    const text =
`📅 NOVO AGENDAMENTO

👤 Cliente:
${ctx.pushname}

📞 Número:
wa.me/${
ctx.sender.split("@")[0]
}

💇 Serviço:
${appointment.service.name}

⏰ Horário:
${appointment.time}
`

//TIMER PARA IMPEDIR O AGUARDANDO MENSAEGM

    setTimeout(async () => {

  try {

    await this.send(

      ctx.sock,

      admin,

      text

    )

  } catch (err) {

    console.log(
      'Erro ao notificar admin:',
      err
    )

  }

}, 1500)
  }

}

module.exports =
NotificationManager