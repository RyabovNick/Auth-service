const Sequelize = require('sequelize');

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const database = process.env.DB_DATABASE;

const sequelize = new Sequelize(database, user, password, {
  dialect: 'mariadb',
  host: host,
  port: port,
  logging: false,
  define: {
    underscored: false,
    freezeTableName: false,
    charset: 'utf8',
    timestamps: false,
  },
  dialectOptions: {
    collate: 'utf8_general_ci',
    useUTC: true,
    timezone: 'Etc/GMT0',
  },
  pool: {
    max: 100,
    idle: 30000,
    acquire: 60000,
  },
});

module.exports = sequelize;
