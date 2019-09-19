const router = require('express').Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const { toAuthJSON } = require('../config/jwt')
const Users = require('../models/users')

router.post('/login', (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      msg: 'Логин или пароль не может быть пустым'
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
      } else {
        return res.status(400).json(info)
      }
    }
  )(req, res, next)
})

/**
 * API для выхода со всех устройств
 */
router.get('/logout', (req, res, next) => {
  let decoded = jwt.decode(req.headers.authorization.split(' ')[1])

  Users.update(
    {
      token: null
    },
    {
      where: {
        username: decoded.username
      }
    }
  )
    .then(user => {
      res.sendStatus(200)
    })
    .catch(err => {
      res.status(400).send(err)
    })
})



module.exports = router
