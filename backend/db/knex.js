const knex = require('knex')
const knexion = knex({
    client: 'sqlite3', // or 'better-sqlite3'
    connection: {
      filename: "./database.db"
    }
  });
  module.exports = knexion