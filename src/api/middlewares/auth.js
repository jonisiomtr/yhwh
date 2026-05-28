const jwt =
require('../auth/jwt')

module.exports =
(req, res, next) => {

  const authHeader =
  req.headers.authorization

  if (!authHeader) {

    return res.status(401)
    .json({

      error:
      'Token não enviado'

    })
  }

  const parts =
  authHeader.split(' ')

  if (
    parts.length !== 2
  ) {

    return res.status(401)
    .json({

      error:
      'Token inválido'

    })
  }

  const [
    scheme,
    token
  ] = parts

  if (
    !/^Bearer$/i.test(
      scheme
    )
  ) {

    return res.status(401)
    .json({

      error:
      'Token mal formatado'

    })
  }

  try {

    const decoded =
    jwt.verify(token)

    req.user =
    decoded

    return next()

  } catch (error) {

    return res.status(401)
    .json({

      error:
      'Token inválido'

    })
  }

}