const fs = require('fs')
const path = require('path')

const Database =
require('../database/Database')

const ConnectionManager =
require('../managers/ConnectionManager')

module.exports = {

  start() {

    console.log(
      '🚀 AppointmentManager iniciado'
    )

    setInterval(async () => {

      try {

        const tenantsPath =
        path.join(
          __dirname,
          '../tenants'
        )

        const companies =
        fs.readdirSync(
          tenantsPath
        )

        for (const companyId of companies) {

          const session =
          ConnectionManager.get(companyId)

          // CLIENTE NÃO CONECTADO
          if (
            !session?.sock
          ) {

            continue
          }

          const appointments =
          Database.all(
            companyId,
            'appointments'
          )

          let updatedAppointments =
          [...appointments]

          for (const appointment of appointments) {

            // DATA
            const [
              day,
              month,
              year
            ] =
            appointment.date.split('/')

            // HORA
            const [
              hour,
              minute
            ] =
            appointment.time.split(':')

            const appointmentDate =
            new Date(

              Number(year),
              Number(month) - 1,
              Number(day),
              Number(hour),
              Number(minute)

            )

            const now =
            new Date()

            // DIFERENÇA EM MINUTOS
            const diff =
            Math.floor(
              (
                appointmentDate - now
              ) / 1000 / 60
            )

            // LEMBRETE 1 HORA ANTES
            if (

              diff <= 60 &&
              diff >= 59 &&
              !appointment.oneHourReminder

            ) {

              // CLIENTE
              await session.sock.sendMessage(

                appointment.customer,

                {

                  text:
`⏰ Seu agendamento está chegando!

Estamos te lembrando que falta cerca de 1 hora para seu atendimento 😊

💇 Serviço:
${appointment.service.name}

📅 Data:
${appointment.date}

⏰ Horário:
${appointment.time}

Nos vemos em breve 🚀`

                }

              )

              // CONFIG
              const configPath =
              path.join(

                __dirname,

                `../tenants/${companyId}/config.json`

              )

              if (
                fs.existsSync(configPath)
              ) {

                const config =
                JSON.parse(
                  fs.readFileSync(configPath)
                )

                // EMPRESA
                if (
                  config.adminNumber
                ) {

                  await session.sock.sendMessage(

                    config.adminNumber,

                    {

                      text:
`📢 Cliente chegando em 1 hora

👤 Cliente:
${appointment.customer}

💇 Serviço:
${appointment.service.name}

📅 ${appointment.date}

⏰ ${appointment.time}`

                    }

                  )

                }

              }

              appointment.oneHourReminder =
              true

            }

            // ÚLTIMO AVISO - 2 MINUTOS
            if (

              diff <= 2 &&
              diff >= 1 &&
              !appointment.finalReminder

            ) {

              // CLIENTE
              await session.sock.sendMessage(

                appointment.customer,

                {

                  text:
`🚨 ÚLTIMO LEMBRETE DO SEU AGENDAMENTO

Seu horário está quase chegando 😄

💇 Serviço:
${appointment.service.name}

📅 Data:
${appointment.date}

⏰ Horário:
${appointment.time}

Estamos te aguardando 💙`

                }

              )

              // CONFIG
              const configPath =
              path.join(

                __dirname,

                `../tenants/${companyId}/config.json`

              )

              if (
                fs.existsSync(configPath)
              ) {

                const config =
                JSON.parse(
                  fs.readFileSync(configPath)
                )

                // EMPRESA
                if (
                  config.adminNumber
                ) {

                  await session.sock.sendMessage(

                    config.adminNumber,

                    {

                      text:
`🚨 Cliente chegando agora

👤 Cliente:
${appointment.customer}

💇 Serviço:
${appointment.service.name}

📅 ${appointment.date}

⏰ ${appointment.time}`

                    }

                  )

                }

              }

              appointment.finalReminder =
              true

            }

            // REMOVE AGENDAMENTO EXPIRADO
            if (
              now > appointmentDate
            ) {

              updatedAppointments =
              updatedAppointments.filter(
                a =>
                  a.id !== appointment.id
              )

            }

          }

          // SALVA
          Database.write(

            companyId,

            'appointments',

            updatedAppointments

          )

        }

      } catch (err) {

        console.log(
          'Erro AppointmentManager:',
          err
        )

      }

    }, 60000)

  }

}