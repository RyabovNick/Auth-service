const sql = require('mssql')

const pool = new sql.ConnectionPool({
  user: process.env.DB_1C_USER,
  password: process.env.DB_1C_PASS,
  server: process.env.DB_1C_SERVER,
  database: process.env.DB_1C_DATABASE,
  pool: {
    max: 100,
    min: 0,
    idleTimeoutMillis: 30000
  }
})

module.exports = pool
