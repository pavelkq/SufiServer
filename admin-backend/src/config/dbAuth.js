// src/config/dbAuth.js
const { Pool } = require('pg');

const poolAuth = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'auth',          // жёстко или через env
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => poolAuth.query(text, params),
  pool: poolAuth,
};
