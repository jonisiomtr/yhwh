const fs = require('fs')
const path = require('path')

const ClientManager = require('./ClientManager')
const loadModules = require('./ModuleLoader')

module.exports = function reloadClientModules(clientId) {
  const client = ClientManager.get(clientId)

  if (!client) {
    console.log(`❌ Cliente não encontrado: ${clientId}, iniciando cliente...`)
    try {
      const { startClient } = require('../bootstrap/startClient')
      startClient(clientId)
    } catch (err) {
      console.log('Erro iniciando cliente:', err)
      return false
    }
    return true
  }

  const configPath = path.join(__dirname, `../tenants/${clientId}/config.json`)
  if (!fs.existsSync(configPath)) {
    console.log(`❌ Config não encontrada: ${clientId}`)
    return false
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const modules = loadModules(config.modules || [])

  client.modules = modules
  client.config = config

  console.log(`🔄 Módulos atualizados: ${clientId}`)

  return true
}