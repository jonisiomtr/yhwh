function generateTimes(
  open,
  close,
  interval
) {

  const times = []

  let [openHour, openMinute] =
  open.split(':').map(Number)

  let [closeHour, closeMinute] =
  close.split(':').map(Number)

  let current =
  openHour * 60 + openMinute

  let end =
  closeHour * 60 + closeMinute

  // SUPORTE MADRUGADA
  if (end <= current) {

    end += 24 * 60
  }

  while (current < end) {

    const hour =
    Math.floor(current / 60) % 24

    const minute =
    current % 60

    const formatted =
`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

    times.push(formatted)

    current += interval
  }

  return times
}

module.exports =
generateTimes