const router = require('express').Router()
// const auth = require('../config/auth')
const jwt = require('jsonwebtoken')
const secret = process.env.SECRET_JWT
const { validationLogger } = require('../lib/logger')
const Users = require('../models/users')
const { generateJWT } = require('../lib/jwt/jwtGenerator')

router.get('/tokenValidation', async (req, res, next) => {
  const { authorization, refreshtoken } = req.headers

  if (
    (authorization && authorization.split(' ')[0] === 'Token') ||
    (authorization && authorization.split(' ')[0] === 'Bearer')
  ) {
    try {
      const decodedToken = await jwt.verify(authorization.split(' ')[1], secret)

      validationLogger.log('success', 'successValidation', {
        username: decodedToken.username
      })
      return res.status(200).send(decodedToken)
    } catch (err) {
      if (err.name === 'TokenExpiredError' && refreshtoken) {
        const decodedToken = await jwt.decode(authorization.split(' ')[1])

        const user = await Users.findOne({
          attributes: ['id', 'username', 'token'],
          where: {
            username: decodedToken.username,
            token: refreshtoken
          }
        })

        if (!user) return next({ ...err, status: 401 })

        const returnInfo = decodedToken.user
          ? {
              ...decodedToken.user,
              token: generateJWT(user)
            }
          : {
              token: generateJWT(user)
            }

        return res.send(returnInfo)
      } else {
        return next({ ...err, status: 401 })
      }
    }
  }

  return next({ message: 'No authorization token was found', status: 401 })
})

module.exports = router
