const pool = require('./db');
const bcrypt = require('bcryptjs');
const Users = require('../models/users');

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
        From users
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
              INSERT INTO users (username, hash, domain, last_check)
              VALUES (?,?,?,?)
            `,
              [username, hash, user.domain, new Date()],
            )
            .then(res => {
              resolve(username);
            })
            .catch(e => {
              reject(e);
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

function dbUserCheck(username, password) {
  return new Promise((resolve, reject) => {
    Users.findAll({
      attributes: ['username', 'hash'],
      where: {
        username,
      },
    })
      .then(users => {
        if (users.length !== 0) {
          const { hash } = users[0].dataValues;
          bcrypt.compare(password, hash, (err, res) => {
            if (err) reject(err);
            if (res) resolve(true);
            else resolve(false);
          });
        } else {
          reject(new Error('UserDoesNotExist'));
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    // pool
    //   .query(
    //     `
    //   Select username, hash
    //   FROM users
    //   where username = ?
    // `,
    //     [username],
    //   )
    //   .then(rows => {})
    //   .catch(err => {
    //     reject(err);
    //   });
  });
}

function setPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  return hash;
}

module.exports = {
  dbUserAdd,
  dbUserCheck,
};
