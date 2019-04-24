const router = require("express").Router();
const auth = require("../config/auth");
const jwt = require("jsonwebtoken");

router.route("/secure").get(auth.required, (req, res, next) => {
  let decoded = jwt.decode(req.headers.authorization.split(" ")[1]);
  res.send(decoded);
});

module.exports = router;
