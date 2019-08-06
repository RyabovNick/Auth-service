const pool = require('./db');
const router = require('express').Router();
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const {
  logger,
  authLogger
} = require('../lib/logger');

router.route('/addMarkTest').post((req, res, next) => {
  pool.connect(err => {
    if (err) res.sendStatus(400);

    const lesson_date = today().now;
    const lesson = req.body.lesson;
    const id_typeControlPoints = req.body.typeControlPoints;
    const typeMarks = req.body.typeMarks;
    const name = req.body.name;
    const idTeacher = req.body.idTeacher;
    const studyGroup = req.body.studyGroup;
    const typeLesson = 'Лекция';
    const request = new sql.Request(pool);
    request.query(
      `
      INSERT INTO control_points (lesson_date, lesson, id_type_control_points, id_type_marks, name, id_teacher, study_group, type_lesson)
      VALUES (?,?,?,?,?,?,?,?)      
    `,
      [lesson_date, lesson, id_typeControlPoints, typeMarks, name, idTeacher, studyGroup, typeLesson],
      (err, result) => {
        if (err) {
          loggerPriem.log('error', 'Get specialities error', {
            err,
          });
          res.sendStatus(400);
        }

        pool.close();
        res.send(result.recordset);
      },
    );
  });
});

//get date as yyyy-mm-dd
function today() {
  let currentTime = new Date();
  let dd = currentTime.getDate();
  let mm = currentTime.getMonth() + 1;
  let yyyy = currentTime.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  return {
    now: yyyy + '-' + mm + '-' + dd,
  };
}

module.exports = dbControlPointsAdd;