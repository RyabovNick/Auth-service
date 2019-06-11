const Sequelize = require('sequelize');
const db = require('../config/db');

const Users = db.define('users', {
  username: {
    type: Sequelize.STRING(150),
  },
  hash: {
    type: Sequelize.STRING(250),
  },
  token: {
    type: Sequelize.STRING(512),
  },
  domain: {
    type: Sequelize.STRING(100),
  },
  last_check: {
    type: Sequelize.DATE,
  },
});

module.exports = Users;