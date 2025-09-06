const db = require('../config/dbArticles');

// Создать новую версию статьи
async function createArticleVersion({ article_id, markdown_text, html_text, created_at = new Date() }) {
  const res = await db.query(
    `INSERT INTO article_versions (article_id, markdown_text, html_text, created_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [article_id, markdown_text, html_text, created_at]
  );
  return res.rows[0];
}

// Получить последние версии статьи (лимит 3)
async function getVersionsByArticleId(article_id, limit = 3) {
  const res = await db.query(
    `SELECT * FROM article_versions WHERE article_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [article_id, limit]
  );
  return res.rows;
}

// Получить конкретную версию по ID
async function getVersionById(id) {
  const res = await db.query(`SELECT * FROM article_versions WHERE id = $1`, [id]);
  return res.rows[0];
}

// Удалить старые версии, оставив последние keep (например, 2)
async function deleteOldVersions(article_id, keep = 2) {
  const res = await db.query(
    `DELETE FROM article_versions
     WHERE article_id = $1
       AND id NOT IN (
         SELECT id FROM article_versions
         WHERE article_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       )`,
    [article_id, keep]
  );
  return res.rowCount;
}

module.exports = {
  createArticleVersion,
  getVersionsByArticleId,
  getVersionById,
  deleteOldVersions,
};
