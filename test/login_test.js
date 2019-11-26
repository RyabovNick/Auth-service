const supertest = require('supertest')
const chai = require('chai')
const faker = require('faker')
const app = require('../index')

const expect = chai.expect
const requester = supertest(app)
const should = chai.should()

describe('login', () => {
  const student = {
    username: process.env.STUDENT_LOGIN,
    password: process.env.STUDENT_PASS
  }
  const teacher = {
    username: process.env.TEACHER_LOGIN,
    password: process.env.TEACHER_PASS
  }

  for (let i = 0; i < 20; i++) {
    let fakeUsername = faker.name.firstName()
    let fakePassword = faker.internet.password(6)
    describe(`Не существующий пользователь #${i}`, () => {
      it('Должен вернуть {msg: "Неверный логин или пароль"}', done => {
        requester
          .post('/api/login')
          .send({
            username: fakeUsername,
            password: fakePassword
          })
          .end((err, res) => {
            if (err) console.log(err)
            res.status.should.be.equal(400)
            should.exist(res.body.errors)
            should.exist(res.body.errors.message)
            should.exist(res.body.errors.status)
            expect(res.body.errors.message).to.equal('Неверный логин или пароль')
            done()
          })
      })
    })

    describe(`Не введён логин #${i}`, () => {
      it('Должен вернуть  {msg: "Логин или пароль не может быть пустым"}', done => {
        requester
          .post('/api/login')
          .send({
            password: fakePassword
          })
          .end((err, res) => {
            if (err) console.log(err)
            res.status.should.be.equal(400)
            should.exist(res.body.errors)
            should.exist(res.body.errors.message)
            should.exist(res.body.errors.status)
            expect(res.body.errors.message).to.equal('Логин или пароль не может быть пустым')
            done()
          })
      })
    })

    describe(`Не введён пароль #${i}`, () => {
      it('Должен вернуть  {msg: "Логин или пароль не может быть пустым"}', done => {
        requester
          .post('/api/login')
          .send({
            username: fakeUsername
          })
          .end((err, res) => {
            if (err) console.log(err)
            res.status.should.be.equal(400)
            should.exist(res.body.errors)
            should.exist(res.body.errors.message)
            should.exist(res.body.errors.status)
            expect(res.body.errors.message).to.equal('Логин или пароль не может быть пустым')
            done()
          })
      })
    })

    describe(`Передано пустое тело #${i}`, () => {
      it('Должен вернуть  {msg: "Логин или пароль не может быть пустым"}', done => {
        requester.post('/api/login').end((err, res) => {
          if (err) console.log(err)
          res.status.should.be.equal(400)
          should.exist(res.body.errors)
          should.exist(res.body.errors.message)
          should.exist(res.body.errors.status)
          expect(res.body.errors.message).to.equal('Логин или пароль не может быть пустым')
          done()
        })
      })
    })

    describe(`Существующий студент #${i}`, () => {
      it('Должен вернуть информацию и токен', done => {
        requester
          .post('/api/login')
          .send({
            username: student.username,
            password: student.password
          })
          .end((err, res) => {
            if (err) console.log(err)
            try {
              res.status.should.be.equal(200)
              should.exist(res.body)
              should.exist(res.body.user)
              should.exist(res.body.user.username)
              should.exist(res.body.user.fio)
              should.exist(res.body.user.role)
              should.exist(res.body.user.group)
              should.exist(res.body.user.oneCcode)
              should.exist(res.body.user.token)
              should.exist(res.body.user.refreshToken)
              expect(res.body.user.role).to.equal('Student')
              done()
            } catch (err) {
              console.error(err)
            }
          })
      })
    })

    describe(`Существующий преподаватель #${i}`, () => {
      it('Должен вернуть информацию и токен', done => {
        requester
          .post('/api/login')
          .send({
            username: teacher.username,
            password: teacher.password
          })
          .end((err, res) => {
            if (err) console.log(err)
            try {
              res.status.should.be.equal(200)
              should.exist(res.body.user)
              should.exist(res.body.user.username)
              // should.exist(res.body.user.fio)
              should.exist(res.body.user.role)
              // should.exist(res.body.user.caf)
              // should.exist(res.body.user.oneCcode)
              should.exist(res.body.user.token)
              should.exist(res.body.user.refreshToken)
              expect(res.body.user.role).to.equal('Teacher')
              done()
            } catch (err) {
              console.error(err)
            }
          })
      })
    })
  }
})
