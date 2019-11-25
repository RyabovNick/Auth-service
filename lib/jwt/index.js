const { generateJWT } = require('./jwtGenerator')

/**
 * Return token to user
 * @param {Array} user - id, email
 */
function toAuthJSON(user) {
  return {
    username: user.username,
    fio: user.fio,
    role: user.role,
    group: user.group,
    oneCcode: user.oneCcode,
    token: generateJWT(user),
    refreshToken: user.token
  }
}

module.exports = {
  toAuthJSON
}
