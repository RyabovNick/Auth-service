const Sequelize = require('sequelize')
const sequelize = require('../config/db')
const Model = Sequelize.Model
const Users = require('./users')
const Roles = require('./roles')

class User_roles extends Model {}

// !!!Добавить внешний ключ
User_roles.init(
  {
    role_id: {
      type: Sequelize.INTEGER
    },
    user_id: {
      type: Sequelize.INTEGER
    },
    from: {
      type: Sequelize.DATE
    },
    to: {
      type: Sequelize.DATE
    }
  },
  {
    sequelize,
    modelName: 'user_roles',
    underscored: true
  }
)

// Users.hasMany(User_roles);
// User_roles.belongsTo(Users)
// Roles.hasMany(User_roles);
// User_roles.belongsTo(Roles)

module.exports = User_roles
