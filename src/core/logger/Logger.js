const fs = require('fs')
const path = require('path')

class Logger {

  static getDate() {

    return new Date()
      .toISOString()
      .split('T')[0]
  }

  static getTime() {

    return new Date()
      .toLocaleTimeString()
  }

  static getPath() {

    const logsDir =
    path.join(
      __dirname,
      '../../../logs'
    )

    if (
      !fs.existsSync(logsDir)
    ) {

      fs.mkdirSync(
        logsDir
      )
    }

    return path.join(

      logsDir,

      `${this.getDate()}.log`

    )
  }

  static write(
    type,
    message
  ) {

    const line =
`[${this.getTime()}]
[${type}]
${message}

`

    fs.appendFileSync(

      this.getPath(),

      line

    )

    console.log(line)
  }

  static info(message) {

    this.write(
      'INFO',
      message
    )
  }

  static error(message) {

    this.write(
      'ERROR',
      message
    )
  }

  static warn(message) {

    this.write(
      'WARN',
      message
    )
  }

}

module.exports =
Logger