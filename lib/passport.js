const passport = require('passport')
const { dbUserAdd, dbUserCheck } = require('./localDB')
const LocalStrategy = require('passport-local').Strategy
const ldapAuth = require('./ldap')
const { logger } = require('../lib/logger')

const url = 'ldap://10.210.50.72'
const domain = 'free.uni-dubna.ru'
const suffix = 'dc=' + domain.replace(/\./g, ',dc=')

const urlUnidomain = 'ldap://unidomain.uni-dubna.ru'
const domainUnidomain = 'unidomain.uni-dubna.ru'
const suffixUnidomain = 'dc=' + domainUnidomain.replace(/\./g, ',dc=')

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await dbUserCheck({ username, password })

      // если нашли - авторизуем
      if (user) {
        logger.log('info', 'User success login', {
          result: username
        })
        return done(null, user)
      }

      // ищем в free ldap
      const ldapUserFree = await ldapAuth(url, domain, suffix, username, password)

      // если нашли - добавляем в локальную базу
      if (ldapUserFree) {
        const addUser = await dbUserAdd({ username, password, user: ldapUserFree })

        if (!addUser)
          return done(null, false, {
            msg: 'Неверный логин или пароль'
          })

        logger.log('info', 'User success login and add to local db', {
          result: addUser
        })
        return done(null, addUser)
      }

      // если в локальной базе не найдено - ищем в unidomain
      const ldapUserUnidomain = await ldapAuth(
        urlUnidomain,
        domainUnidomain,
        suffixUnidomain,
        username,
        password
      )

      if (ldapUserUnidomain) {
        const addUser = await dbUserAdd({ username, password, user: ldapUserUnidomain })

        logger.log('info', 'User success login and add to local db', {
          result: addUser
        })
        return done(null, addUser)
      }

      return done(null, false, {
        msg: 'Неверный логин или пароль'
      })
    } catch (err) {
      console.log('err: ', err)
      return done(null, false, {
        msg: 'Произошла ошибка, пожалуйста, попробуйте позднее',
        err
      })
    }
  })
)
