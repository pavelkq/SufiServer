const db = require('../config/dbArticles');

async function getCategories() {
  const res = await db.query(`SELECT * FROM categories ORDER BY name ASC`);
  return res.rows;
}

async function createCategory(name) {
  const res = await db.query(`INSERT INTO categories (name) VALUES ($1) RETURNING *`, [name]);
  return res.rows[0];
}

async function updateCategory(id, name) {
  const res = await db.query(`UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`, [name, id]);
  return res.rows[0];
}

async function deleteCategory(id) {
  // Проверка на статьи
  const countRes = await db.query(`SELECT COUNT(*) FROM articles WHERE category_id = $1`, [id]);
  if (parseInt(countRes.rows[0].count, 10) > 0) {
    throw new Error('Категория не может быть удалена, пока в ней есть статьи');
  }
  const res = await db.query(`DELETE FROM categories WHERE id = $1 RETURNING *`, [id]);
  return res.rows[0];
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
