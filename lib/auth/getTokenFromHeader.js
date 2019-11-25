/**
 * Find token in header and return authorization part
 * Authorization header can started grom 'Token your_token' or
 * 'Bearer your_token'
 * @param {*} req - all header parameters
 */
function getTokenFromHeader(req) {
  const { authorization } = req.headers
  if (
    (authorization && authorization.split(' ')[0] === 'Token') ||
    (authorization && authorization.split(' ')[0] === 'Bearer')
  ) {
    return authorization.split(' ')[1]
  }

  return null
}

module.exports = {
  getTokenFromHeader
}
