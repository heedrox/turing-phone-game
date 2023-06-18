const fetch = require('node-fetch');




exports.removeDatabase = async (db) => {
  return await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/turing-phone-game/databases/(default)/documents`, {
    method: 'DELETE',
  })
}