const sql = require('mssql')
const pool = require('../../config/1c_db')

const checkLeader = async oneCcode => {
  try {
    const connection = await pool.connect()
    const result = await connection
      .request()
      .input('code', sql.NChar, oneCcode)
      .query(
        `
          Select t2.Ссылка, t2.Код
          From [UniversityPROF].[dbo].СтаростыГрупп as t1
          left Join [UniversityPROF].[dbo].[Справочник_ФизическиеЛица] as t2 on t2.Ссылка = t1.ФизическоеЛицо_Ссылка
          Where Период like '4019%' and t2.Код = @code
            `
      )

    pool.close()

    return result
  } catch (e) {
    throw new Error(e)
  }
}

module.exports = {
  checkLeader
}
