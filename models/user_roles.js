const Sequelize = require('sequelize');
const db = require('../config/db');
const Users = require('./users');
const Roles = require('./roles');

const User_roles = db.define('user_roles', {
  from: {
    type: Sequelize.DATE,
  },
  to: {
    type: Sequelize.DATE,
  }
}, {
  underscored: true,
});

Users.hasMany(User_roles);
User_roles.belongsTo(Users);
Roles.hasMany(User_roles);
User_roles.belongsTo(Roles);

module.exports = User_roles;