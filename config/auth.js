/**
 * auth middleware
 */

const jwt = require('express-jwt')
const secret = process.env.SECRET_JWT // change to env variable

/**
 * Find token in header and return authorization part
 * Authorization header can started grom 'Token your_token' or
 * 'Bearer your_token'
 * @param {*} req - all header parameters
 */
function getTokenFromHeader(req) {
  if (
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
  ) {
    return req.headers.authorization.split(' ')[1]
  }

  return null
}

/**
 * JSON
 */
let auth = {
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
