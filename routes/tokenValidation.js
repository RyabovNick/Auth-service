const router = require('express').Router()
const auth = require('../config/auth')
const jwt = require('jsonwebtoken')
const jwtCheckValid = require('express-jwt')
const secret = process.env.SECRET_JWT
const { validationLogger } = require('../lib/logger')
const Users = require('../models/users')
const { generateJWT } = require('../config/jwt')

router.route('/tokenValidation').get((req, res, next) => {
  if (
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
  ) {
    jwt.verify(req.headers.authorization.split(' ')[1], secret, (err, decodedToken) => {
      // Если ошибка
      if (err || !decodedToken) {
        // То проверяем какая именно
        // Истёкщий токен обрабатываем отдельно
        if (err.name === 'TokenExpiredError' && req.headers.refreshtoken) {
          // с таким названием должен на клиенте добавляться в header
          // key: RefreshToken; value: your_token
          const { refreshtoken } = req.headers

          // TODO: декодировать токен
          // проверить наличие такого токена у конкретного пользователя
          // а не у всех

          Users.findAll({
            attributes: ['id', 'username', 'hash', 'token'],
            where: {
              token: refreshtoken
            }
          }).then(users => {
            // если пользователя не нашли, то надо вернуть 401
            if (users.length === 0) {
              res.status(401).send(err)
            } else {
              // декодировать старый токен
              // достать оттуда нужные объекты
              // и сгенерировать новый токен с такой же payload
              const { ...user } = jwt.decode(req.headers.authorization.split(' ')[1])

              const returnUser = {
                ...user,
                token: generateJWT(user)
              }

              res.send(returnUser)
            }
            // если нашли пользователя с таким refreshToken
            // то надо сгенерировать новый токен
          })

          // console.log(err)
          // res.status(401).send(err);

          // Проверить в базе, соответствует ли переданный
          // refreshToken тому, что лежит в базе.
          // Если да, то сгенерить новый hourToken
          // Если нет, то вернуть код 401 и ошибку
        } else {
          res.status(401).send(err)
        }
      } else {
        let decoded = jwt.decode(req.headers.authorization.split(' ')[1])
        validationLogger.log('success', 'successValidation', {
          username: decoded.username
        })
        res.status(200).send(decoded)
      }
    })
  }
})

module.exports = router
