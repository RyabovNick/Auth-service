const supertest = require('supertest');
const chai = require('chai');
const faker = require('faker');
const app = require('../index');

const expect = chai.expect;
const requester = supertest(app);
const should = chai.should();

describe('tokenValidation', () => {
  const student = {
    username: process.env.STUDENT_LOGIN,
    password: process.env.STUDENT_PASS,
    token: null,
  };
  const teacher = {
    username: process.env.TEACHER_LOGIN,
    password: process.env.TEACHER_PASS,
    token: null,
  };

  const fakeToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlJ5YU5WLnRoIiwiZmlvIjoi0KDRj9Cx0L7QsiDQndC40LrQuNGC0LAg0JLQu9Cw0LTQuNC80LjRgNC-0LLQuNGHIiwicm9sZSI6IlRlYWNoZXJzIiwiY2FmIjoi0JrQsNGE0LXQtNGA0LAg0YHQuNGB0YLQtdC80L3QvtCz0L4g0LDQvdCw0LvQuNC30LAg0LGg0yPQv9GA0LDQstC70LXQvdC40Y8iLCJvbmVDY29kZSI6IjEwMDA4NjU2MiIsImV4cCI6MTU2MDI0Mzk0OSwiaWF0IjoxNTU4NTE1OTUwfQ.6C5rHoIEGyQFawJhaoj3ByhPgbyU2KZyDgwNaFN9Cm8';
  const invalidToken =
    'ophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuweophqfwhpowefhpqoewufbpfbuwe';

  describe(`Существующий студент`, () => {
    it('Должен вернуть информацию и токен', done => {
      requester
        .post('/api/login')
        .send({
          username: student.username,
          password: student.password,
        })
        .end((err, res) => {
          if (err) console.log(err);
          res.status.should.be.equal(200);
          should.exist(res.body.user);
          should.exist(res.body.user.username);
          should.exist(res.body.user.fio);
          should.exist(res.body.user.role);
          should.exist(res.body.user.caf);
          should.exist(res.body.user.oneCcode);
          should.exist(res.body.user.token);
          expect(res.body.user.role).to.equal('Students');
          student.token = res.body.user.token;
          done();
        });
    });
  });

  describe(`Существующий преподаватель`, () => {
    it('Должен вернуть информацию и токен', done => {
      requester
        .post('/api/login')
        .send({
          username: teacher.username,
          password: teacher.password,
        })
        .end((err, res) => {
          if (err) console.log(err);
          res.status.should.be.equal(200);
          should.exist(res.body.user);
          should.exist(res.body.user.username);
          should.exist(res.body.user.fio);
          should.exist(res.body.user.role);
          should.exist(res.body.user.caf);
          should.exist(res.body.user.oneCcode);
          should.exist(res.body.user.token);
          expect(res.body.user.role).to.equal('Teachers');
          teacher.token = res.body.user.token;
          done();
        });
    });
  });

  describe(`Отсутствует токен`, () => {
    it(`Должен вернуть No authorization token was found`, done => {
      requester.get('/api/tokenValidation').end((err, res) => {
        if (err) console.log(err);
        res.status.should.be.equal(401);
        should.exist(res.body.errors);
        expect(res.body.errors.message).to.equal(
          'No authorization token was found',
        );
        done();
      });
    });
  });

  describe(`Токен не валиден`, () => {
    it(`Должен вернуть No authorization token was found`, done => {
      requester
        .get('/api/tokenValidation')
        .set('Authorization', `Token ${fakeToken}`)
        .end((err, res) => {
          if (err) console.log(err);
          res.status.should.be.equal(401);
          should.exist(res.body.errors);
          expect(res.body.errors.message).to.equal('invalid signature');
          done();
        });
    });
  });

  describe(`Токен не той формы`, () => {
    it(`Должен вернуть jwt malformed`, done => {
      requester
        .get('/api/tokenValidation')
        .set('Authorization', `Token ${invalidToken}`)
        .end((err, res) => {
          if (err) console.log(err);
          res.status.should.be.equal(401);
          should.exist(res.body.errors);
          expect(res.body.errors.message).to.equal('jwt malformed');
          done();
        });
    });
  });

  for (let i = 0; i < 50; i++) {
    describe(`Правильный токен студента #${i}`, () => {
      it('Должен вернуть информацию', done => {
        requester
          .get('/api/tokenValidation')
          .set('Authorization', `Token ${student.token}`)
          .end((err, res) => {
            if (err) console.log(err);
            res.status.should.be.equal(200);
            should.exist(res.body.username);
            should.exist(res.body.fio);
            should.exist(res.body.role);
            should.exist(res.body.caf);
            should.exist(res.body.oneCcode);
            should.exist(res.body.exp);
            should.exist(res.body.iat);
            expect(res.body.role).to.equal('Students');
            done();
          });
      });
    });

    describe(`Правильный токен преподавателя #${i}`, () => {
      it('Должен вернуть информацию', done => {
        requester
          .get('/api/tokenValidation')
          .set('Authorization', `Token ${teacher.token}`)
          .end((err, res) => {
            if (err) console.log(err);
            res.status.should.be.equal(200);
            should.exist(res.body.username);
            should.exist(res.body.fio);
            should.exist(res.body.role);
            should.exist(res.body.caf);
            should.exist(res.body.oneCcode);
            should.exist(res.body.exp);
            should.exist(res.body.iat);
            expect(res.body.role).to.equal('Teachers');
            done();
          });
      });
    });
  }
});
