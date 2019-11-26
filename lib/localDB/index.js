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
  const { domain, ...information } = user

  delete information.username

  const newUser = await Users.create({
    username,
    hash,
    token,
    domain,
    last_check: new Date(),
    information
  })

  const addId = newUser.id
  if (user.role === 'Students') {
    const studentInfo = await findStudentInfoBy1Ccode(user.oneCcode)
    const nowRole = await checkLeader(studentInfo.oneCcode)

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

  if (user.role === 'Worker') {
    return {
      ...information,
      username,
      token
    }
  }
}

const dbUserCheck = async ({ username, password }) => {
  const user = await Users.findOne({
    attributes: ['id', 'username', 'hash', 'token'],
    where: {
      username
    }
  })

  if (user) {
    const { hash } = user
    const hashPassword = await bcrypt.compare(password, hash)

    if (!hashPassword) {
      return false
    }

    if (user.token === '' || user.token === null) {
      // получаем новый токен
      const token = generateRefreshJWT()

      const [student] = await Promise.all([
        Students.findAll({
          attributes: ['id', 'fio', 'oneCcode', 'group'],
          where: {
            id: user[0].id
          }
        }),
        user.update({
          token
        })
      ])

      const nowRole = await checkLeader(student[0].dataValues.oneCcode)

      return toAuthJSON({
        ...student[0].dataValues,
        role: nowRole.length === 0 ? 'Leader' : 'Student',
        token,
        username
      })
    }

    const { token } = user

    const [student] = await Students.findAll({
      attributes: ['id', 'fio', 'oneCcode', 'group'],
      where: {
        id: user.id
      }
    })
    // TODO: если это преподаватель, то никакой инфы не достаётся

    const nowRole = student ? await checkLeader(student.dataValues.oneCcode) : undefined

    const role = !nowRole ? 'Teacher' : nowRole.recordset.length != 0 ? 'Leader' : 'Student'

    const returnInfo =
      student && student.dataValues
        ? {
            ...student.dataValues,
            role,
            token,
            username
          }
        : {
            role,
            token,
            username
          }

    return returnInfo
  } else {
    return
  }
}

module.exports = {
  dbUserAdd,
  dbUserCheck
}
