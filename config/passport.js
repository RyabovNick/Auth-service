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
  new LocalStrategy((username, password, done) => {
    // Проверяем в локальной базе
    dbUserCheck(username, password)
      .then(user => {
        logger.log('info', 'User success login', {
          result: username
        })
        done(null, user)
      })
      .catch(err => {
        // если в локальной базе не найдено - ищем в free ldap
        ldapAuth(url, domain, suffix, username, password)
          .then(user => {
            // добавляем в локальную базу
            dbUserAdd(username, password, user)
              .then(res => {
                logger.log('info', 'User success login and add to local db', {
                  result: user
                })
                done(null, res)
              })
              .catch(e => {
                console.log('e: ', e)
                logger.log('error', 'User add to local db fail', {
                  e
                })
                done(null, false, {
                  msg: 'Произошла ошибка, пожалуйста, попробуйте позднее'
                })
              })
          })
          .catch(err => {
            // Если не нашли в free - ищем в unidomain
            ldapAuth(urlUnidomain, domainUnidomain, suffixUnidomain, username, password)
              .then(user => {
                // добавляем в локальную базу
                dbUserAdd(username, password, user)
                  .then(res => {
                    logger.log('info', 'User success login and add to local db', {
                      result: user
                    })
                    done(null, user)
                  })
                  .catch(e => {
                    logger.log('error', 'User add to local db fail', {
                      e
                    })
                    done(null, false, {
                      msg: 'Произошла ошибка, пожалуйста, попробуйте позднее'
                    })
                  })
              })
              .catch(e => {
                if (e.message === 'InvalidCredentialsError') {
                  logger.log('error', 'User InvalidCredentialsError', {
                    e
                  })
                  done(null, false, {
                    msg: 'Неверный логин или пароль'
                  })
                } else {
                  logger.log('error', 'User login fail', {
                    e
                  })
                  done(null, false, {
                    msg: 'Произошла ошибка, пожалуйста, попробуйте позднее'
                  })
                }
              })
          })
      })
  })
)
