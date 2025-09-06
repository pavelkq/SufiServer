const pool = require('../db');

async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

// Добавляем параметр name и сохраняем его в БД
async function createUser(email, passwordHash, name = '', role = 1) {
  const res = await pool.query(
    'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
    [email, passwordHash, name, role]
  );
  return res.rows[0];
}

// Новая функция обновления пароля пользователя
async function updateUserPassword(userId, passwordHash) {
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );
}

module.exports = {
  findUserByEmail,
  createUser,
  updateUserPassword,
};
