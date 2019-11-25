const bcrypt = require('bcryptjs')
const Users = require('../../models/users')
const Students = require('../../models/students')
const User_roles = require('../../models/user_roles')
const { toAuthJSON } = require('../jwt')
const { generateRefreshJWT } = require('../jwt/jwtGenerator')
const { findStudentInfoBy1Ccode } = require('./findStudentInfo')
const { checkLeader } = require('./checkLeader')

/**
 * Save user info to local db
 * @param {String} username
 * @param {String} password
 * @param {Object} user
 */
const dbUserAdd = async ({ username, password, user }) => {
  const hash = await bcrypt.hash(password, 10)
  const token = generateRefreshJWT()

  const newUser = await Users.create({
    username,
    hash,
    token,
    domain: user.domain,
    last_check: new Date()
  })

  const addId = newUser.id
  if (user.role === 'Students') {
    const studentInfo = await findStudentInfoBy1Ccode(user.oneCcode)
    const nowRole = await checkLeader(studentInfo.oneCcode)

    // берём только 1-ую запись
    // по идее в таком запросе для каждого должна
    // возвращаться 1 запись (так и есть, но вдруг косяк какой)
    // добавить ещё id, т.к. users - students 1 to 1
    studentInfo.id = addId
    const userRole = {
      // поправить на поиск id роли в базе
      role_id: nowRole.recordset.length ? 4 : 1,
      user_id: addId,
      from: new Date()
      // добавить до какого момента действует роль (или нет)
    }

    const [addStudent] = await Promise.all([
      Students.create(studentInfo),
      User_roles.create(userRole)
    ])

    return {
      ...addStudent.dataValues,
      role: nowRole.length === 0 ? 'Leader' : 'Student',
      username,
      token
    }
  }
}

const dbUserCheck = async ({ username, password }) => {
  const users = await Users.findAll({
    attributes: ['id', 'username', 'hash', 'token'],
    where: {
      username
    }
  })

  if (users.length !== 0) {
    const { hash } = users[0]
    const hashPassword = await bcrypt.compare(password, hash)

    if (!hashPassword) {
      return false
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
        Users.update(
          {
            token
          },
          {
            where: {
              id: users[0].id
            }
          }
        )
      ])

      let nowRole
      try {
        nowRole = await checkLeader(student[0].dataValues.oneCcode)
      } catch (e) {
        reject(new Error('checkLeaderError'))
      }

      return new Promise(resolve => {
        const user = toAuthJSON({
          ...student[0].dataValues,
          role: nowRole.length === 0 ? 'Leader' : 'Student', // тащить из базы, искать все
          token,
          username
        })

        resolve(user)
      })
    }

    const { token } = users[0]

    const [student] = await Students.findAll({
      attributes: ['id', 'fio', 'oneCcode', 'group'],
      where: {
        id: users[0].id
      }
    })

    const nowRole = student ? await checkLeader(student.dataValues.oneCcode) : undefined

    return {
      ...student.dataValues,
      role: !nowRole ? 'Teacher' : nowRole.recordset.length != 0 ? 'Leader' : 'Student', // тащить из базы, искать все
      token,
      username
    }
  } else {
    return
  }
}

module.exports = {
  dbUserAdd,
  dbUserCheck
}
