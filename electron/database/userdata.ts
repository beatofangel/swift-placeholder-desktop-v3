import sqlite3 from 'sqlite3'

// export async function beginTx(callback) {
//   if (!callback) return
//   let result
//   try {
//     result = await sequelize.transaction(async tx => {
//       return await callback(tx)
//     })
//   } catch (error) {
//     await tx.rollback()
//     console.log('Transaction was rollbacked.')
//   }

//   return result
// }

import { open } from 'sqlite'
sqlite3.verbose()
// you would have to import / invoke this in another file
export async function openDb () {
  return open({
    filename: 'database/userdata.db',
    // filename: path.join(__dirname, 'database/userdata.db'),
    driver: sqlite3.Database
  })
}