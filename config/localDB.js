const sql = require('mssql');
const pool = require('../config/1c_db');
const bcrypt = require('bcryptjs');
const Users = require('../models/users');
const Students = require('../models/students');
const User_roles = require('../models/user_roles');
const {
  generateRefreshJWT
} = require('./jwt');

/**
 * Save user info to local db
 * @param {String} username
 * @param {String} password
 * @param {Object} user
 */
function dbUserAdd(username, password, user) {
  return new Promise((resolve, reject) => {
    const hash = setPassword(password);
    const token = generateRefreshJWT()
    Users.create({
        username,
        hash,
        token,
        domain: user.domain,
        last_check: new Date(),
      })
      .then(newUser => {
        let addId;
        if (newUser.dataValues) addId = newUser.dataValues.id;
        else addId = newUser.id;
        // лезе в базу 1С и ищем инфу
        if (user.role === 'Students') {
          pool.connect(err => {
            if (err) reject(err);

            const request = new sql.Request(pool);
            request.input('code', sql.NChar, user.oneCcode);
            request.query(
              `
              Select [Код] as [code]
                ,[Полное_Имя] as [fio]
                ,[Имя] as [name]
                ,[Фамилия] as [surname]
                ,[Отчество] as [patronymic]
                ,[Дата_Рождения] as [birth]
                ,[Пол] as [sex]
                ,[Зачетная_Книга] as [id_book]
                ,[Форма_Обучения] as [form]
                ,[Факультет] as [faculty]
                ,[Направление] as [direction]
                ,[Профиль] as [profile]
                ,[Курс] as [course]
                ,[Группа] as [group]
                ,[Основа] as [basis]
                ,[Вид_Образования] as [kind]
                ,[Уровень_Подготовки] as [level]
                ,[Учебный_Год] as [year]
              FROM [UniversityPROF].[dbo].[су_ИнформацияОСтудентах]
              where Код = RIGHT('0000' + @code, 9) and [Статус] = 'Является студентом'
              order by Учебный_Год desc
              `,
              (err, result) => {
                if (err) reject(err);
                // берём только 1-ую запись
                // по идее в таком запросе для каждого должна
                // возвращаться 1 запись (так и есть, но вдруг косяк какой)
                let student = result.recordset[0];
                // добавить ещё id, т.к. users - students 1 to 1
                student.id = addId;
                Students.create(student)
                  .then(newStudent => {
                    console.log('newStudent: ', newStudent);

                    newStudent.dataValues = {
                      token,
                      role: user.role,
                      caf: user.caf,
                      oneCcode: user.oneCcode,
                      username
                    }

                    const userRole = {
                      // поправить на поиск id роли в базе
                      role_id: 1,
                      people_id: addId,
                      from: new Date(),
                      // добавить до какого момента действует роль (или нет)
                    }

                    User_roles.create(userRole)
                      .then(() => {
                        resolve(newStudent.dataValues);
                      })
                      .catch(e => {
                        reject(e);
                      })

                  })
                  .catch(e => {
                    reject(e);
                  });



              },
            );
          });
        }
        // что это?
        // resolve(username);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function dbUserCheck(username, password) {
  return new Promise((resolve, reject) => {
    Users.findAll({
        attributes: ['id', 'username', 'hash', 'token'],
        where: {
          username,
        },
      })
      .then(users => {
        if (users.length !== 0) {

          const {
            hash
          } = users[0].dataValues;
          bcrypt.compare(password, hash, (err, res) => {
            if (err) reject(err);

            if (res) {
              if (users[0].dataValues.token === '') {

                // получаем новый токен

                const token = generateRefreshJWT();

                Users.update({
                  token
                }, {
                  where: {
                    id: users[0].dataValues.id
                  }
                }).then(() => {
                  // добавить больше информации о пользователе (роль, группа и т.д.)
                  // тащить из базы:
                  // роль, username, oneCcode, caf, fio
                  resolve({
                    token
                  })
                })

              } else {
                // вернуть всю информацию о пользователе
                resolve(users[0].dataValues);
              }
            } else reject(false);
          });
        } else {
          reject(new Error('UserDoesNotExist'));
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function setPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  return hash;
}

module.exports = {
  dbUserAdd,
  dbUserCheck,
};