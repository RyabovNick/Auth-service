const ldap = require("ldapjs");

const url = "ldap://free.uni-dubna.ru";
const domain = "free.uni-dubna.ru";
const userPrincipalName = "RyaNV.th";
const passw = "913135";

let client = ldap.createClient({
  url: url
});

client.bind(`${userPrincipalName}@${domain}`, passw, err => {
  if (err != null) {
    if (err.name === "InvalidCredentialsError") console.log("Credential error");
    else console.log("Unknown error: " + JSON.stringify(err));
  } else console.log(`Hello ${userPrincipalName}`);
});

let suffix = "dc=" + domain.replace(/\./g, ",dc=");

// client.search(suffix, {
//   scope: "sub",
//   filter: "(userPrincipalName=" + userPrincipalName + ")"
// });

var opts = {
  filter: `(sAMAccountName=${userPrincipalName})`, //username
  scope: "sub",
  attributes: [
    "cn", //ФИО
    "memberOf", //Группа
    "department", //Кафедра (но не для всех)
    "employeeNumber" //код 1С
  ]
};

let opts1 = {
  filter: `(1='Dubna')`, //username
  scope: "sub",
  attributes: ["memberOf"]
};

client.search(suffix, opts, function(err, res) {
  if (err) throw err;

  res.on("searchEntry", function(entry) {
    console.log("ФИО: " + entry.object.cn);
    let patt = /CN=[a-zA-Z]+/g;
    let groupObject = entry.object.memberOf.match(patt);
    let group = groupObject[0].replace("CN=", "");
    console.log("group: ", group);
    console.log("Кафедра: " + entry.object.department);
    console.log("Код 1С: " + entry.object.employeeNumber);
  });
  res.on("searchReference", function(referral) {
    console.log("referral: " + referral.uris.join());
  });
  res.on("error", function(err) {
    console.error("error: " + err.message);
  });
  res.on("end", function(result) {
    console.log("status: " + result.status);
  });
});
