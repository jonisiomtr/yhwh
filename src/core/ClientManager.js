class ClientManager {

   constructor() {
      this.clients = new Map()
   }

   add(id, client) {
      this.clients.set(id, client)
   }

   get(id) {
      return this.clients.get(id)
   }

   getAll() {
      return [...this.clients.values()]
   }

   remove(id) {
    this.clients.delete(id)
  }

}

module.exports = new ClientManager()
