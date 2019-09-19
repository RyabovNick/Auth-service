const Sequelize = require('sequelize')
const sequelize = require('../config/db')
const Model = Sequelize.Model

class Roles extends Model {}

Roles.init(
  {
    name: {
      type: Sequelize.STRING(250)
    }
  },
  {
    sequelize,
    modelName: 'roles'
  }
)

module.exports = Roles
