// src/config/dbArticles.js
const { Pool } = require('pg');

const poolArticles = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'articles',      // именно эта база
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => poolArticles.query(text, params),
  pool: poolArticles,
};
