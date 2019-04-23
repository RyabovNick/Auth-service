require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const router = express.Router();
const errorhandler = require("errorhandler");
// добавить логгер, https, cors(?)
require("./config/passport");
const https = require("https");
const fs = require("fs");

const app = express();

const isProduction = process.env.NODE_ENV === "development";

// const sslOptions = {
//   pfx: fs.readFileSync('./sslcert.pfx'),
//   passphrase: process.env.SSL_PASS,
// };

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SECRET,
    cookit: { maxAge: 60 * 24 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false
  })
);

if (!isProduction) {
  app.use(errorhandler());
}

app.use((req, res, next) => {
  let err = new Error("Not Found");
  err.status = 404;
  next(err);
});

if (!isProduction) {
  app.use((err, req, res, next) => {
    // console.log(err.stack);

    res.status(err.status || 500);

    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: {}
      }
    });
  });
}

app.use(require("./routes"));

// http
var server = app.listen(process.env.PORT || 3000, function() {
  // console.log('Listening on port ' + server.address().port);
});

// https.createServer(sslOptions, app).listen(process.env.PORT || 3000, () => {
//     // console.log(`Listening ...`);
// });

module.exports = router;
module.exports = app;
