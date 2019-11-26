require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const errorhandler = require('errorhandler')
const https = require('https')
const fs = require('fs')
const { logger } = require('./lib/logger')
const helmet = require('helmet')
const cors = require('cors')

const app = express()
app.use(helmet())
app.use(cors())

const isProduction = process.env.NODE_ENV === 'production'

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

if (!isProduction) {
  app.use(errorhandler())
}

require('./lib/passport')
app.use(require('./routes'))

app.use((req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404
  logger.log('error', 'Error Not Found', { err })
  next(err)
})

if (!isProduction) {
  app.use((err, req, res, next) => {
    console.log(err.stack)

    const status = err.status || 500

    res.status(status)

    res.json({
      errors: {
        message: err.message,
        status,
        error: err
      }
    })
  })
} else {
  app.use(function(err, req, res, next) {
    const status = err.status || 500
    res.status(status)
    res.json({
      errors: {
        message: err.message,
        status
      }
    })
  })
}

// http
if (process.env.NODE_ENV === 'development') {
  let server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port ' + server.address().port)
  })
} else {
  const sslOptions = {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.cer')
  }
  // const sslOptions = {
  //   pfx: fs.readFileSync('./sslcert.pfx'),
  //   passphrase: process.env.SSL_PASS,
  // };

  https.createServer(sslOptions, app).listen(process.env.PORT || 3000, () => {
    console.log(`Listening on ${process.env.PORT}`)
  })
}

module.exports = router
module.exports = app
