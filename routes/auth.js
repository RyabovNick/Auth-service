const router = require("express").Router();
const passport = require("passport");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET_JWT;
const auth = require("../config/auth");

router.post("/login", (req, res, next) => {
  if (!req.body.user.email || !req.body.user.password) {
    return res
      .status(400)
      .json({ message: "Логин или пароль не может быть пустым" });
  }

  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (user) {
      return res.json({ user: toAuthJSON(user) });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

/**
 * Return token to user
 * @param {Array} user - id, email
 */
function toAuthJSON(user) {
  return {
    username: user[1],
    token: generateJWT(user)
  };
}

/**
 * Generate JWT
 * @param {Array} user - id and username for JWT token payload
 */
function generateJWT(user) {
  let today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      // тут ещё добавить код1с, роль и прочее
      id: user[0],
      username: user[1],
      exp: parseInt(exp.getTime() / 1000)
    },
    secret
  );
}

module.exports = router;
