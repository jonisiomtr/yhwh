const path = require('path')

module.exports =
function loadModules(
   moduleNames = []
) {

   const loadedModules = []

   for (const moduleName of moduleNames) {

      try {

         const modulePath =
         path.join(
            __dirname,
            `../modules/${moduleName}`
         )

         delete require.cache[
  require.resolve(modulePath)
]

const mod =
require(modulePath)

loadedModules.push(mod)

         console.log(
            `Módulo carregado: ${moduleName}`
         )

      } catch (err) {

         console.log(
            `Erro ao carregar módulo ${moduleName}`,
   err
         )

      }

   }

   return loadedModules

}