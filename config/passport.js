const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const ldap = require("ldapjs");

const url = "ldap://free.uni-dubna.ru";
const domain = "free.uni-dubna.ru";
const suffix = "dc=" + domain.replace(/\./g, ",dc=");

passport.use(
  new LocalStrategy((username, password, done) => {
    console.log("username: ", username);
    console.log("password: ", password);
    // ldap auth
    let client = ldap.createClient({
      url: url, // check if "getaddrinfo ENOTFOUND" still exist
      connectTimeout: 2000,
      timeout: 5000
    });

    client.on("error", err => {
      // handle error here
      console.log("err: ", err);
    });

    client.on("connectTimeout", err => {
      // handler here
      // The ldap connection attempt has been timed out...
      console.log("err: ", err);
    });

    client.on("connect", function() {
      // The ldap connection is ready to use.
      // Place your subsequent ldapjs code here...
    });

    client.bind(`${username}@${domain}`, password, err => {
      if (err != null) {
        if (err.name === "InvalidCredentialsError")
          done(null, false, { msg: "Неверный логин или пароль" });
        else
          done(null, false, {
            msg: "Произошла ошибка, пожалуйста, попробуйте позднее"
          });
      } else {
        let options = {
          filter: `(sAMAccountName=${username})`,
          scope: "sub", //what is it?
          attributes: [
            "cn", //ФИО
            "memberOf", //Группа
            "department", //Кафедра (но не для всех)
            "employeeNumber" //код 1С
          ]
        };

        console.log("suffix: ", suffix);
        client.search(suffix, options, (err, res) => {
          if (err)
            done(null, false, {
              msg: "Произошла ошибка, пожалуйста, попробуйте позднее"
            });

          console.log(res);
          res.on("searchEntry", entry => {
            let user = {};
            user.username = username;
            user.fio = entry.object.cn;

            let patt = /CN=[a-zA-Z]+/g;
            let roleObject = entry.object.memberOf.match(patt);
            let role = roleObject[0].replace("CN=", "");
            user.role = role;
            user.caf = entry.object.department;
            user.oneCcode = entry.object.employeeNumber;

            console.log("user: ", user);
            done(null, user);
          });
          res.on("searchReference", referral => {
            // what is it?
            console.log("referral: " + referral.uris.join());
          });
          res.on("error", err => {
            done(null, false, {
              msg: "Произошла ошибка, пожалуйста, попробуйте позднее"
            });
          });
          res.on("end", result => {
            // what is it?
            console.log("status: " + result.status);
            client.unbind(err => {
              // handle error here
              console.log("err1: ", err);
            });
          });
        });
      }
    });
  })
);
