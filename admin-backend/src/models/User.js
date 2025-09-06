const db = require('../config/dbAuth');
const { v4: uuidv4 } = require('uuid');

/**
 * Получить пользователя по ID
 * @param {number|string} id 
 * @returns {Promise<Object|null>}
 */
async function getUserById(id) {
  const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

/**
 * Получить пользователя по email
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
async function getUserByEmail(email) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

/**
 * Получение пользователей с пагинацией, фильтрами и сортировкой
 * @param {Array<number>} range [start, end]
 * @param {Object} filter
 * @param {Array} sort [field, order]
 * @returns {Promise<Array>}
 */
async function getUsersWithPagination(range, filter, sort) {
  const [start, end] = range;
  const limit = end - start + 1;
  const offset = start;

  let whereClause = '';
  const values = [];
  if (filter.email) {
    values.push(`%${filter.email}%`);
    whereClause = `WHERE u.email ILIKE $${values.length}`;
  }

  const orderBy = `ORDER BY ${sort[0]} ${sort[1]}`;

  const query = `
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.role, 
      g.name AS group_name, 
      u.email_confirmed
    FROM users u
    LEFT JOIN groups g ON u.role = g.id
    ${whereClause}
    ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  values.push(limit, offset);

  const res = await db.query(query, values);
  return res.rows;
}

/**
 * Получить количество пользователей с фильтром
 * @param {Object} filter
 * @returns {Promise<number>}
 */
async function getUsersCount(filter) {
  let whereClause = '';
  const values = [];
  if (filter.email) {
    values.push(`%${filter.email}%`);
    whereClause = `WHERE email ILIKE $1`;
  }

  const query = `SELECT COUNT(*) FROM users ${whereClause}`;
  const res = await db.query(query, values);
  return parseInt(res.rows[0].count, 10);
}

/**
 * Обновить группу пользователя
 * @param {number|string} userId 
 * @param {number|string|null} groupId 
 * @returns {Promise<Object>}
 */
async function updateGroup(userId, groupId) {
  const res = await db.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
    [groupId, userId]
  );
  return res.rows[0];
}

/**
 * Обновить пользователя по id и обновлениям (например, имени, email, роли)
 * @param {number|string} id 
 * @param {Object} updates 
 * @returns {Promise<Object|null>}
 */
async function updateUserById(id, updates) {
  const { name, email, role } = updates;

  const res = await db.query(
    `UPDATE users SET 
      name = COALESCE($1, name),
      email = COALESCE($2, email),
      role = COALESCE($3, role)
     WHERE id = $4
     RETURNING *`,
    [name, email, role, id]
  );

  return res.rows[0];
}

/**
 * Удалить пользователя по id
 * @param {number|string} userId 
 * @returns {Promise<Object|null>}
 */
async function deleteUserById(userId) {
  const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
  return res.rows[0];
}

/**
 * Генерация и сохранение токена подтверждения email
 * @param {number|string} userId 
 * @returns {Promise<string>} токен
 */
async function setEmailConfirmationToken(userId) {
  const token = uuidv4();
  await db.query(
    'UPDATE users SET email_confirmation_token = $1 WHERE id = $2',
    [token, userId]
  );
  return token;
}

/**
 * Подтверждение email по токену
 * @param {string} token 
 * @returns {Promise<Object|null>}
 */
async function confirmEmailByToken(token) {
  const res = await db.query(
    `UPDATE users 
     SET email_confirmed = TRUE, 
         email_confirmation_token = NULL
     WHERE email_confirmation_token = $1
     RETURNING *`,
    [token]
  );
  return res.rows[0];
}

/**
 * Обновить хеш пароля пользователя
 * @param {number|string} userId 
 * @param {string} hashedPassword 
 * @returns {Promise<Object|null>}
 */
async function updateUserPassword(userId, hashedPassword) {
  const res = await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
    [hashedPassword, userId]
  );
  return res.rows[0];
}

module.exports = {
  getUserById,
  getUserByEmail,
  getUsersWithPagination,
  getUsersCount,
  updateGroup,
  updateUserById,
  deleteUserById,
  setEmailConfirmationToken,
  confirmEmailByToken,
  updateUserPassword, // Добавлено необходимое обновление пароля
};
