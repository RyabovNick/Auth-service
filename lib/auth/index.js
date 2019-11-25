const jwt = require('express-jwt')
const secret = process.env.SECRET_JWT
const { getTokenFromHeader } = require('./getTokenFromHeader')

const auth = {
  required: jwt({
    secret: secret,
    userProperty: 'payload',
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret: secret,
    userProperty: 'payload',
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
}

module.exports = auth
