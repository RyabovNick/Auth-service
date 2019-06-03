const ldap = require('ldapjs');
const { logger, authLogger } = require('../lib/logger');

/**
 * Check and return user information from ldap
 * @param {String} url
 * @param {String} domain
 * @param {String} suffix
 * @param {String} username
 * @param {String} password
 */
function ldapAuth(url, domain, suffix, username, password) {
  return new Promise((resolve, reject) => {
    // ldap auth
    let client = ldap.createClient({
      url: url, // check if "getaddrinfo ENOTFOUND" still exist
      connectTimeout: 2000,
      timeout: 5000,
      reconnect: {
        initialDelay: 100,
        maxDelay: 1000,
        failAfter: 10,
      },
    });

    client.on('error', err => {
      logger.log('error', 'ldapCreateClientError', { err });
      reject(err);
    });

    client.on('connectTimeout', err => {
      // handler here
      // The ldap connection attempt has been timed out...
      logger.log('error', 'ldapConnectTimeoutError', { err });
      reject(err);
    });

    client.on('connect', function() {
      // The ldap connection is ready to use.
      // Place your subsequent ldapjs code here...
    });

    client.bind(`${username}@${domain}`, password, err => {
      if (err != null) {
        if (err.name === 'InvalidCredentialsError') {
          logger.log('error', 'InvalidCredentialsError', { username });
          reject(new Error('InvalidCredentialsError'));
        } else {
          try {
            logger.log('error', 'LdapAuthError', { username });
            reject(new Error('LdapAuthError'));
          } catch (e) {
            reject(new Error('LdapAuthError'));
          }
        }
      } else {
        authLogger.log('success', 'successAuth', { username });

        const options = {
          filter: `(sAMAccountName=${username})`,
          scope: 'sub',
          attributes: [
            'cn', //ФИО
            'memberOf', //Группа
            'department', //Кафедра (но не для всех)
            'employeeNumber', //код 1С
          ],
        };

        client.search(suffix, options, (err, res) => {
          if (err) {
            logger.log('error', 'LdapSearchError', { username, options });
            reject(new Error('LdapSearchError'));
          }

          res.on('searchEntry', entry => {
            let user = {};

            // возвращаем другие данные если unidomain
            if (domain.includes('unidomain')) {
              user.username = username;
              user.fio = entry.object.cn;
              user.role = 'Worker';
              user.domain = 'unidomain';

              resolve(user);
            } else {
              user.username = username;
              user.fio = entry.object.cn;

              let patt = /CN=[a-zA-Z]+/g;
              let roleObject = entry.object.memberOf.match(patt);
              let role = roleObject[0].replace('CN=', '');
              user.role = role;

              user.caf = entry.object.department;
              user.oneCcode = entry.object.employeeNumber;
              user.domain = 'free';

              resolve(user);
            }
          });
          res.on('searchReference', referral => {});
          res.on('error', err => {
            logger.log('error', 'LdapAuthError', { username, err });
            reject(new Error('LdapAuthError'));
          });
          res.on('end', result => {
            client.unbind(err => {
              if (err) {
                logger.log('error', 'LdapUnbindError', { username, err });
                reject(err);
              }
            });
          });
        });
      }
    });
  });
}

module.exports = ldapAuth;
