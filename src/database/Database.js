const fs = require('fs')
const path = require('path')

class Database {

  static getPath(
    clientId,
    collection
  ) {

    return path.join(

      __dirname,

      `../tenants/${clientId}/${collection}.json`

    )
  }

  static read(
    clientId,
    collection
  ) {

    const filePath =
    this.getPath(
      clientId,
      collection
    )

    if (
      !fs.existsSync(filePath)
    ) {

      fs.writeFileSync(
        filePath,
        JSON.stringify([], null, 2)
      )
    }

    return JSON.parse(
      fs.readFileSync(filePath)
    )
  }

  static write(
    clientId,
    collection,
    data
  ) {

    const filePath =
    this.getPath(
      clientId,
      collection
    )

    fs.writeFileSync(

      filePath,

      JSON.stringify(
        data,
        null,
        2
      )

    )
  }

  static create(
    clientId,
    collection,
    item
  ) {

    const data =
    this.read(
      clientId,
      collection
    )

    item.id =
    Date.now()

    data.push(item)

    this.write(

      clientId,

      collection,

      data

    )

    return item
  }

  static all(
    clientId,
    collection
  ) {

    return this.read(
      clientId,
      collection
    )
  }

}

module.exports =
Database