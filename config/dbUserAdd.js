const pool = require('./db');
const bcrypt = require('bcryptjs');
const { logger, authLogger } = require('../lib/logger');

/**
 * Save user info to local db
 * @param {String} username
 * @param {String} password
 * @param {Object} user
 */
function dbUserAdd(username, password, user) {
  return new Promise((resolve, reject) => {
    pool
      .query(
        `
        Select *
        From peoples
        Where username = ?
      `,
        [username],
      )
      .then(rows => {
        if (rows.length === 0) {
          const hash = setPassword(password);

          pool
            .query(
              `
              INSERT INTO peoples (username, hash, domain, last_check)
              VALUES (?,?,?,?)
            `,
              [username, hash, user.domain, new Date()],
            )
            .then(res => {
              console.log('res: ', res);
            })
            .catch(e => {
              console.log('e: ', e);
            });
        } else {
          // обновить информацию о пользователе
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function setPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  return hash;
}

module.exports = dbUserAdd;
