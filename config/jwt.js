const jwt = require('jsonwebtoken');
const secret = process.env.SECRET_JWT;

/**
 * Generate JWT
 * @param {Array} user - id and username for JWT token payload
 */
function generateJWT(user) {
  let today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getHours() + 3);

  return jwt.sign(
    {
      username: user.username,
      fio: user.fio,
      role: user.role,
      caf: user.caf,
      oneCcode: user.oneCcode,
      exp: parseInt(exp.getTime() / 1000),
    },
    secret,
  );
}

function generateRefreshJWT() {
  let today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign(
    {
      exp: parseInt(exp.getTime() / 1000),
    },
    secret,
  );
}

module.exports = { generateJWT, generateRefreshJWT };