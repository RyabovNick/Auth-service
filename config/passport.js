const passport = require('passport');
const pool = require('./db');
const LocalStrategy = require('passport-local').Strategy;
const ldapAuth = require('./ldap');
const { logger, authLogger } = require('../lib/logger');

const url = 'ldap://10.210.50.72';
const domain = 'free.uni-dubna.ru';
const suffix = 'dc=' + domain.replace(/\./g, ',dc=');

const urlUnidomain = 'ldap://unidomain.uni-dubna.ru';
const domainUnidomain = 'unidomain.uni-dubna.ru';
const suffixUnidomain = 'dc=' + domainUnidomain.replace(/\./g, ',dc=');

passport.use(
  new LocalStrategy((username, password, done) => {
    // Проверяем наличие пользователя в локальной БД
    // Авторизация через домен free
    ldapAuth(url, domain, suffix, username, password)
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        // Если не вышло, то пробуем через unidomain
        ldapAuth(
          urlUnidomain,
          domainUnidomain,
          suffixUnidomain,
          username,
          password,
        )
          .then(user => {
            done(null, user);
          })
          .catch(e => {
            if (e.message === 'InvalidCredentialsError') {
              done(null, false, { msg: 'Неверный логин или пароль' });
            } else {
              done(null, false, {
                msg: 'Произошла ошибка, пожалуйста, попробуйте позднее',
              });
            }
          });
      });
  }),
);
