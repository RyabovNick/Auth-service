const router = require("express").Router();
const passport = require("passport");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const secret = process.env.SECRET_JWT;

router.post("/login", (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    return res
      .status(400)
      .json({ msg: "Логин или пароль не может быть пустым" });
  }

  passport.authenticate("local", { session: false }, (err, user, info) => {
    console.log("auth_user: ", user);
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
    username: user.username,
    fio: user.fio,
    role: user.role,
    caf: user.caf,
    oneCcode: user.oneCcode,
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
      username: user.username,
      fio: user.fio,
      role: user.role,
      caf: user.caf,
      oneCcode: user.oneCcode,
      exp: parseInt(exp.getTime() / 1000)
    },
    secret
  );
}

module.exports = router;
