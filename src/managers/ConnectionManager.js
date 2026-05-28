const connections = {}

module.exports = {

  set(
    clientId,
    data
  ) {

    connections[
      clientId
    ] = {

      ...connections[
        clientId
      ],

      ...data

    }

  },

  get(clientId) {

    return connections[
      clientId
    ]

  },

  remove(clientId) {

    delete connections[
      clientId
    ]

  },

  all() {

    return connections

  }

}