const db = require('../config/dbArticles');

async function getTags() {
  const res = await db.query(`SELECT * FROM tags ORDER BY name ASC`);
  return res.rows;
}

async function createTag(name) {
  const res = await db.query(`INSERT INTO tags (name) VALUES ($1) RETURNING *`, [name]);
  return res.rows[0];
}

async function updateTag(id, name) {
  const res = await db.query(`UPDATE tags SET name = $1 WHERE id = $2 RETURNING *`, [name, id]);
  return res.rows[0];
}

async function deleteTag(id) {
  // Можно добавить проверку использования тегов в статье, если надо
  const res = await db.query(`DELETE FROM tags WHERE id = $1 RETURNING *`, [id]);
  return res.rows[0];
}

module.exports = {
  getTags,
  createTag,
  updateTag,
  deleteTag,
};
