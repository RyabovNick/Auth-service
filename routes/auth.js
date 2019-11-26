const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const { toAuthJSON } = require('../lib/jwt')
const Users = require('../models/users')

router.post('/login', (req, res, next) => {
  const { username, password } = req.body
  if (!username || !password) {
    return next({
      status: 400,
      message: 'Логин или пароль не может быть пустым',
      name: 'validationError'
    })
  }

  passport.authenticate(
    'local',
    {
      session: false
    },
    (err, user, info) => {
      if (err) {
        return next(err)
      }

      if (user) {
        return res.json({
          user: toAuthJSON(user)
        })
      }
      return next({ status: 400, message: info.msg, stack: info.err || undefined })
    }
  )(req, res, next)
})

/**
 * API для выхода со всех устройств
 */
router.get('/logout', async (req, res, next) => {
  const decoded = await jwt.decode(req.headers.authorization.split(' ')[1])

  try {
    const user = await Users.update(
      {
        token: null
      },
      {
        where: {
          username: decoded.username
        }
      }
    )

    if (user) {
      return res.sendStatus(200)
    }
  } catch (err) {
    return next({ ...err, status: 400 })
  }
})

module.exports = router
