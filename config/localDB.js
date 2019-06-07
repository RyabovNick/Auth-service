const sql = require('mssql');
const pool = require('../config/1c_db');
const bcrypt = require('bcryptjs');
const Users = require('../models/users');
const Students = require('../models/students');
const { generateRefreshJWT } = require('./jwt');

/**
 * Save user info to local db
 * @param {String} username
 * @param {String} password
 * @param {Object} user
 */
function dbUserAdd(username, password, user) {
  return new Promise((resolve, reject) => {
    const hash = setPassword(password);
    Users.create({
      username,
      hash,
      token: generateRefreshJWT(),
      domain: user.domain,
      last_check: new Date(),
    })
      .then(newUser => {
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
              where Код = @code and [Статус] = 'Является студентом'
              order by Учебный_Год desc
              `,
              (err, result) => {
                if (err) reject(err);
                // берём только 1-ую запись
                // по идее в таком запросе для каждого должна
                // возвращаться 1 запись (так и есть, но вдруг косяк какой)
                let student = result.recordset[0];
                // добавить ещё id, т.к. users - students 1 to 1
                student.id = newUser.id;
                Students.create(student)
                  .then(newStudent => {
                    resolve(newStudent);
                  })
                  .catch(e => {
                    reject(e);
                  });
              },
            );
          });
        }
        resolve(username);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function dbUserCheck(username, password) {
  return new Promise((resolve, reject) => {
    Users.findAll({
      attributes: ['username', 'hash'],
      where: {
        username,
      },
    })
      .then(users => {
        if (users.length !== 0) {
          const { hash } = users[0].dataValues;
          bcrypt.compare(password, hash, (err, res) => {
            if (err) reject(err);
            if (res) {
              // вернуть всю информацию о пользователе
              resolve(true);
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
