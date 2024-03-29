const sql = require('mssql')
const pool = require('../config/1c_db')
const bcrypt = require('bcryptjs')
const Users = require('../models/users')
const Students = require('../models/students')
const User_roles = require('../models/user_roles')
const {
  generateRefreshJWT,
  toAuthJSON
} = require('./jwt')

/**
 * Save user info to local db
 * @param {String} username
 * @param {String} password
 * @param {Object} user
 */
const dbUserAdd = async ({
  username,
  password,
  user
}) => {
  const hash = setPassword(password)
  const token = generateRefreshJWT()

  const newUser = await Users.create({
    username,
    hash,
    token,
    domain: user.domain,
    last_check: new Date()
  })

  const addId = newUser.id
  // лезем в базу 1С и ищем инфу
  if (user.role === 'Students') {
    const connection = await pool.connect()
    const result = await connection.request()
      .input('code', sql.NChar, user.oneCcode)
      .query(`
        Select [Код] as [oneCcode]
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
        `)
      .catch(err => {
        return new Promise((resolve, reject) => {
          reject(err)
        })
      })

    pool.close()
    let [student] = result.recordset

    let nowRole;
    console.log('student: ', student);

    try {
      nowRole = await checkLeader(student.oneCcode);
      console.log('nowRole: ', nowRole);
    } catch (e) {
      reject(new Error('checkLeaderError'))
    }

    // берём только 1-ую запись
    // по идее в таком запросе для каждого должна
    // возвращаться 1 запись (так и есть, но вдруг косяк какой)
    // добавить ещё id, т.к. users - students 1 to 1
    student.id = addId
    const userRole = {
      // поправить на поиск id роли в базе
      role_id: nowRole.recordset.length ? 4 : 1,
      user_id: addId,
      from: new Date()
      // добавить до какого момента действует роль (или нет)
    }

    const [addStudent] = await Promise.all([
      Students.create(student),
      User_roles.create(userRole)
    ])


    return new Promise((resolve) => {
      resolve({
        ...addStudent.dataValues,
        role: nowRole.length === 0 ? 'Leader' : 'Student',
        username,
        token
      })
    })

  }
}

const dbUserCheck = async ({
  username,
  password
}) => {
  const users = await Users.findAll({
    attributes: ['id', 'username', 'hash', 'token'],
    where: {
      username
    }
  })

  if (users.length !== 0) {
    const {
      hash
    } = users[0]
    const hashPassword = await bcrypt.compare(password, hash)

    if (!hashPassword) {
      return new Promise((resolve) => {
        resolve(false)
      })
    }

    if (users[0].token === '' || users[0].token === null) {
      // получаем новый токен
      const token = generateRefreshJWT()

      const [student] = await Promise.all([
        Students.findAll({
          attributes: ['id', 'fio', 'oneCcode', 'group'],
          where: {
            id: users[0].id
          }
        }),
        Users.update({
          token
        }, {
          where: {
            id: users[0].id
          }
        })
      ])

      let nowRole;
      try {

        console.log('student[0].dataValues.oneCcode: ', student[0].dataValues.oneCcode);
        nowRole = await checkLeader(student[0].dataValues.oneCcode);
        console.log('nowRole: ', nowRole);
      } catch (e) {
        reject(new Error('checkLeaderError'))
      }

      return new Promise((resolve) => {
        const user = toAuthJSON({
          ...student[0].dataValues,
          role: nowRole.length === 0 ? 'Leader' : 'Student', // тащить из базы, искать все
          token,
          username
        })

        resolve(user)
      })
    }

    const {
      token
    } = users[0]

    const student = await Students.findAll({
      attributes: ['id', 'fio', 'oneCcode', 'group'],
      where: {
        id: users[0].id
      }
    })


    let nowRole;
    try {
      console.log('student[0].dataValues.oneCcode: ', student);
      nowRole = await checkLeader(student[0].dataValues.oneCcode);
    } catch (e) {
      console.log('e: ', e);
      //reject(new Error('checkLeaderError'))
    }


    return new Promise((resolve) => {

      const user = {
        ...student[0].dataValues,
        role: nowRole.recordset.length != 0 ? 'Leader' : 'Student', // тащить из базы, искать все
        token,
        username
      }
      resolve(user)
    })
  } else {
    return new Promise((resolve) => {
      resolve()
    })
  }
}

function setPassword(password) {
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(password, salt)

  return hash
}

const checkLeader = async (oneCcode) => {
  try {
    const connection = await pool.connect()
    const result = await connection.request()
      .input('code', sql.NChar, oneCcode)
      .query(`
          Select t2.Ссылка, t2.Код
          From [UniversityPROF].[dbo].СтаростыГрупп as t1
          left Join [UniversityPROF].[dbo].[Справочник_ФизическиеЛица] as t2 on t2.Ссылка = t1.ФизическоеЛицо_Ссылка
          Where Период like '4019%' and t2.Код = @code
            `)
      .catch(err => {
        return new Promise((resolve, reject) => {
          reject(err)
        })
      })
    pool.close()
    return result
  } catch (e) {
    console.log('e: ', e);
    return e
  }
}

module.exports = {
  dbUserAdd,
  dbUserCheck
}