const Sequelize = require('sequelize');
const db = require('../config/db');

const Students = db.define('students', {
  code: {
    type: Sequelize.STRING(150),
  },
  fio: {
    type: Sequelize.STRING(250),
  },
  name: {
    type: Sequelize.STRING(512),
  },
  surname: {
    type: Sequelize.STRING(100),
  },
  patronymic: {
    type: Sequelize.STRING(100),
  },
  birth: {
    type: Sequelize.DATE,
  },
  sex: {
    type: Sequelize.STRING(45),
  },
  id_book: {
    type: Sequelize.STRING(50),
  },
  form: {
    type: Sequelize.STRING(45),
  },
  faculty: {
    type: Sequelize.STRING(100),
  },
  direction: {
    type: Sequelize.STRING(100),
  },
  profile: {
    type: Sequelize.STRING(100),
  },
  course: {
    type: Sequelize.STRING(50),
  },
  group: {
    type: Sequelize.STRING(45),
  },
  basis: {
    type: Sequelize.STRING(45),
  },
  kind: {
    type: Sequelize.STRING(45),
  },
  level: {
    type: Sequelize.STRING(45),
  },
  year: {
    type: Sequelize.INTEGER(4),
  },
});

module.exports = Students;
