const sql = require('mssql')
const pool = require('../../config/1c_db')

/**
 * Return user info by 1C code
 * @param {string} code - 1C code
 */
const findStudentInfoBy1Ccode = async code => {
  const connection = await pool.connect()

  const studentInfoQueryResponse = await connection
    .request()
    .input('code', sql.NChar, code)
    .query(
      `
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
      `
    )

  pool.close()

  const [studentInfo] = studentInfoQueryResponse.recordset

  return studentInfo
}

module.exports = {
  findStudentInfoBy1Ccode
}
