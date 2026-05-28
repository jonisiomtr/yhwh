const fs = require('fs')
const path = require('path')

const generateTimes =
require('../../utils/generateTimes')

const Database =
require('../../database/Database')

// NOTIFICAÇÃO
const NotificationManager =
require('../../managers/NotificationManager')

module.exports = {

  name: 'scheduling',

  flow: 'scheduling',

  priority: 2,

  menu: {

    label: 'Agendamentos'

  },

  events: {

    async onMessage(ctx) {

      const servicesPath =
      path.join(
        __dirname,
        `../../tenants/${ctx.client.id}/services.json`
      )

      // SEM ARQUIVO DE SERVIÇOS
if (
  !fs.existsSync(servicesPath)
) {

  await ctx.reply(
`📅 Esta empresa ainda não cadastrou serviços.`
  )

  ctx.setSession({

    flow: 'assistant',
    step: 'start'

  })

  return false
}

      const services =
      JSON.parse(
        fs.readFileSync(servicesPath)
      )

      // SEM SERVIÇOS CADASTRADOS
if (
  !services.length
) {

  await ctx.reply(
`📅 Esta empresa ainda não cadastrou serviços.`
  )

  ctx.setSession({

    flow: 'assistant',
    step: 'start'

  })

  return false
}

      // =========================
      // MENU PRINCIPAL
      // =========================
      if (
        ctx.session.step === 'start'
      ) {

        let text =
`📅 AGENDAMENTOS

1 - Novo agendamento
2 - Meus agendamentos

Digite uma opção.`

        await ctx.reply(text)

        ctx.setSession({

          step: 'menu'

        })

        return false
      }

      // =========================
      // MENU INTERNO
      // =========================
      if (
        ctx.session.step === 'menu'
      ) {

        // NOVO AGENDAMENTO
        if (
          ctx.body === '1'
        ) {

          let text =
          '📅 SERVIÇOS\n\n'

          services.forEach(
            service => {

              text +=
`${service.id} - ${service.name}
R$ ${service.price}\n\n`

            }
          )

          text +=
          'Digite o número do serviço.'

          await ctx.reply(text)

          ctx.setSession({

            step: 'select_service'

          })

          return false
        }

        // MEUS AGENDAMENTOS
if (
  ctx.body === '2'
) {

  const appointments =
  Database.all(
    ctx.client.id,
    'appointments'
  )

  const customerAppointments =
  appointments.filter(
    appointment =>
      appointment.customer ===
      ctx.sender
  )

  if (
  customerAppointments.length === 0
) {

  await ctx.reply(
`Você não possui agendamentos😉`
  )

  ctx.setSession({

    flow: 'assistant',

    step: 'start'

  })

  return false
}

  let text =
  '📅 SEUS AGENDAMENTOS\n\n'

  customerAppointments.forEach(
    (appointment, index) => {

      text +=
`${index + 1} - ${appointment.service.name}

📅 ${appointment.date}
⏰ ${appointment.time}

`
    }
  )

  text +=
`0 - Voltar ao menu

Digite o número do agendamento que deseja cancelar.`

  await ctx.reply(text)

  ctx.setSession({

    step:
    'cancel_appointment',

    customerAppointments

  })

  return false
}

        await ctx.reply(
          'Opção inválida.'
        )

        return false
      }

      // =========================
      // CANCELAR AGENDAMENTO
      // =========================
      
      // CANCELAR AGENDAMENTO
if (
  ctx.session.step ===
  'cancel_appointment'
) {

  // VOLTAR MENU
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

  const index =
  Number(ctx.body) - 1

  const appointment =
  ctx.session.customerAppointments[index]

  if (!appointment) {

    await ctx.reply(
      'Agendamento inválido.'
    )

    return false
  }

  let appointments =
  Database.all(
    ctx.client.id,
    'appointments'
  )

  appointments =
  appointments.filter(
    a =>
      a.id !== appointment.id
  )

  Database.write(

    ctx.client.id,

    'appointments',

    appointments

  )

  await ctx.reply(
`❌ Agendamento cancelado com sucesso.

📅 ${appointment.date}
⏰ ${appointment.time}`
  )

  ctx.setSession({

    flow: 'assistant',

    step: 'start'

  })

  return false
}

      // =========================
      // ESCOLHER SERVIÇO
      // =========================
      if (
        ctx.session.step ===
        'select_service'
      ) {

        const service =
        services.find(
          s =>
            s.id === Number(ctx.body)
        )

        if (!service) {

          await ctx.reply(
            'Serviço inválido.'
          )

          return false
        }

        ctx.setSession({

          selectedService:
          service,

          step: 'select_date'

        })

        const today =
        new Date()

        const todayFormatted =
`${String(today.getDate()).padStart(2, '0')}/${
String(today.getMonth() + 1).padStart(2, '0')
}/${
today.getFullYear()
}`

        await ctx.reply(
`📅 Digite a data do agendamento

Exemplo:
${todayFormatted}`
        )

        return false
      }

      // =========================
      // ESCOLHER DATA
      // =========================
      if (
        ctx.session.step ===
        'select_date'
      ) {

        const date =
        ctx.body.trim()

        const today =
        new Date()

        const todayFormatted =
`${String(today.getDate()).padStart(2, '0')}/${
String(today.getMonth() + 1).padStart(2, '0')
}/${
today.getFullYear()
}`

        // VALIDAR FORMATO
        const regex =
        /^(\d{2})\/(\d{2})\/(\d{4})$/

        if (
          !regex.test(date)
        ) {

          await ctx.reply(
`❌ Data inválida.

Exemplo correto:
${todayFormatted}`
          )

          return false
        }

        const [
          day,
          month,
          year
        ] =
        date.split('/')

        const selectedDate =
        new Date(
          year,
          month - 1,
          day
        )

        selectedDate.setHours(0,0,0,0)

        const currentDate =
        new Date()

        currentDate.setHours(0,0,0,0)

        // NÃO PERMITE DATA PASSADA
        if (
          selectedDate < currentDate
        ) {

          await ctx.reply(
`❌ Você não pode agendar em datas anteriores.

Hoje é:
${todayFormatted}`
          )

          return false
        }

        ctx.setSession({

          selectedDate: date,

          step: 'select_time'

        })

        // AGENDA
        const schedulePath =
        path.join(
          __dirname,
          `../../tenants/${ctx.client.id}/schedule.json`
        )

        if (
          !fs.existsSync(schedulePath)
        ) {

          await ctx.reply(
            'Agenda não configurada.'
          )

          return false
        }

        const schedule =
        JSON.parse(
          fs.readFileSync(schedulePath)
        )

        const generatedTimes =
        generateTimes(

          schedule.open,

          schedule.close,

          schedule.interval

        )

        // BUSCA AGENDAMENTOS
        const appointments =
        Database.all(
          ctx.client.id,
          'appointments'
        )

        // TEXTO
        let text =
`⏰ HORÁRIOS DISPONÍVEIS
📅 ${date}

`

        generatedTimes.forEach(
          (time, index) => {

            const occupied =
            appointments.find(
              appointment =>
                appointment.date === date &&
                appointment.time === time
            )

            text +=
`${index + 1} - ${time}`

            if (occupied) {

              text +=
              ' ❌ Ocupado'

            } else {

              text +=
              ' ✅'

            }

            text += '\n'

          }
        )

        text +=
'\nDigite o número do horário.'

        await ctx.reply(text)

        return false
      }

      // =========================
      // ESCOLHER HORÁRIO
      // =========================
      if (
        ctx.session.step ===
        'select_time'
      ) {

        const schedulePath =
        path.join(
          __dirname,
          `../../tenants/${ctx.client.id}/schedule.json`
        )

        const schedule =
        JSON.parse(
          fs.readFileSync(schedulePath)
        )

        const generatedTimes =
        generateTimes(

          schedule.open,

          schedule.close,

          schedule.interval

        )

        const time =
        generatedTimes[
          Number(ctx.body) - 1
        ]

        if (!time) {

          await ctx.reply(
            'Horário inválido.'
          )

          return false
        }

        // VERIFICA OCUPADO
        const appointments =
        Database.all(
          ctx.client.id,
          'appointments'
        )

        const occupied =
        appointments.find(
          appointment =>
            appointment.date ===
            ctx.session.selectedDate &&
            appointment.time === time
        )

        if (occupied) {

          await ctx.reply(
            'Esse horário já foi agendado.'
          )

          return false
        }

        ctx.setSession({

          selectedTime: time,

          step: 'confirm'

        })

        await ctx.reply(
`✅ CONFIRMAÇÃO

💇 Serviço:
${ctx.session.selectedService.name}

📅 Data:
${ctx.session.selectedDate}

⏰ Horário:
${time}

1 - Confirmar
2 - Cancelar`
        )

        return false
      }

      // =========================
      // CONFIRMAR
      // =========================
      if (
        ctx.session.step ===
        'confirm'
      ) {

        // CONFIRMAR
        if (
          ctx.body === '1'
        ) {

          Database.create(

            ctx.client.id,

            'appointments',

            {

              customer:
              ctx.sender,

              service:
              ctx.session.selectedService,

              date:
              ctx.session.selectedDate,

              time:
              ctx.session.selectedTime,

              createdAt:
              Date.now()

            }

          )

          // NOTIFICA EMPRESA
          await NotificationManager.newAppointment(

            ctx,

            {

              service:
              ctx.session.selectedService,

              date:
              ctx.session.selectedDate,

              time:
              ctx.session.selectedTime

            }

          )

          await ctx.reply(
`🎉 Agendamento realizado com sucesso!

💇 Serviço:
${ctx.session.selectedService.name}

📅 Data:
${ctx.session.selectedDate}

⏰ Horário:
${ctx.session.selectedTime}

Caso queira cancelar depois,
digite:

agendamentos`
          )

          ctx.setSession({

            flow: 'assistant',

            step: 'start',

            selectedService: null,

            selectedTime: null,

            selectedDate: null

          })

          return false
        }

        // CANCELAR
        if (
          ctx.body === '2'
        ) {

          await ctx.reply(
            'Agendamento cancelado.'
          )

          ctx.setSession({

            flow: 'assistant',

            step: 'start'

          })

          return false
        }

        await ctx.reply(
          'Opção inválida.'
        )

        return false
      }

    }

  }

}