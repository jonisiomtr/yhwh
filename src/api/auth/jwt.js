const jwt =
require('jsonwebtoken')

const SECRET =
'your-secret-key'

module.exports = {

  generate(data) {

    return jwt.sign(

      data,

      SECRET,

      {

        expiresIn: '7d'

      }

    )

  },

  verify(token) {

    return jwt.verify(

      token,

      SECRET

    )

  }

}