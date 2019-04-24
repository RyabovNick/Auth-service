const router = require("express").Router();
const auth = require("../config/auth");

router.route("/secure").get(auth.required, (req, res, next) => {
  res.send("You are in");
});

module.exports = router;
