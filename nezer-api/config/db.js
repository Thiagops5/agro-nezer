const { Sequelize } = require('sequelize');

// Se existir DATABASE_URL no .env, conecta no PostgreSQL (Neon na nuvem).
// Caso contrario, usa o SQLite local (otimo para programar offline sem internet).
const db = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
          dialect: 'postgres',
          dialectOptions: {
              ssl: {
                  require: true,
                  rejectUnauthorized: false
              }
          }
      })
    : new Sequelize({
          dialect: 'sqlite',
          storage: process.env.DB_STORAGE || './database.sqlite'
      });

module.exports = db;
