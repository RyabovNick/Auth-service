const router = require("express").Router();
const auth = require("../config/auth");
const jwt = require("jsonwebtoken");
const { validationLogger } = require("../lib/logger");

router.route("/tokenValidation").get(auth.required, (req, res, next) => {
  let decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
  validationLogger.log("success", "successValidation", {
    username: decoded.username
  });
  res.send(decoded);
});

module.exports = router;
