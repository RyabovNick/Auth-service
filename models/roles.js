const Sequelize = require('sequelize');
const db = require('../config/db');

const Roles = db.define('roles', {
  name: {
    type: Sequelize.STRING(250),
  }
});

module.exports = Roles;