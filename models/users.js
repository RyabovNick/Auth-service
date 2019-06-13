const Sequelize = require('sequelize');
const sequelize = require('../config/db');
const Model = Sequelize.Model;

class Users extends Model {}

Users.init({
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
}, {
  sequelize,
  modelName: 'users'
})

module.exports = Users;