const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const ldap = require("ldapjs");

const url = "ldap://free.uni-dubna.ru";
const domain = "free.uni-dubna.ru";
const suffix = "dc=" + domain.replace(/\./g, ",dc=");

passport.use(
  new LocalStrategy((username, password, done) => {
    // ldap auth
    let client = ldap.createClient({
      url: url
    });

    client.bind(`${username}@${domain}`, password, err => {
      if (err != null) {
        if (err.name === "InvalidCredentialsError")
          done(null, false, { msg: "Неверный логин или пароль" });
        else
          done(null, false, {
            msg: "Произошла ошибка, пожалуйста, попробуйте позднее"
          });
      } else console.log(`Success, search and return user info`);
    });

    let options = {
      filter: `(sAMAccountName=${username}`,
      scope: "sub", //what is it?
      attributes: [
        "cn", //ФИО
        "memberOf", //Группа
        "department", //Кафедра (но не для всех)
        "employeeNumber" //код 1С
      ]
    };

    client.search(suffix, options, (err, res) => {
      if (err)
        done(null, false, {
          msg: "Произошла ошибка, пожалуйста, попробуйте позднее"
        });

      res.on("searchEntry", function(entry) {
        let user = {};
        user.username = username;
        user.fio = entry.object.cn;

        let patt = /CN=[a-zA-Z]+/g;
        let roleObject = entry.object.memberOf.match(patt);
        let role = roleObject[0].replace("CN=", "");
        user.role = role;
        user.caf = entry.object.department;
        user.oneCcode = entry.object.employeeNumber;
        done(null, user);
      });
      res.on("searchReference", function(referral) {
        // what is it?
        console.log("referral: " + referral.uris.join());
      });
      res.on("error", function(err) {
        done(null, false, {
          msg: "Произошла ошибка, пожалуйста, попробуйте позднее"
        });
      });
      res.on("end", function(result) {
        // what is it?
        console.log("status: " + result.status);
      });
    });

    // unbind?
  })
);
