class FlowManager {

  static canExecute(module, ctx) {

    // MODULO GLOBAL
    if (
      module.global
    ) {

      return true

    }

    // SEM FLOW
    if (
      !module.flow
    ) {

      return true

    }

    // FLOW NORMAL
    return (

      module.flow ===
      ctx.session.flow

    )

  }

}

module.exports = FlowManager