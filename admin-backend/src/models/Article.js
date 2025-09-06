const db = require('../config/dbArticles');

async function createArticle({ title, category_id, group_id = 5, publish_date = null, markdown_text = '' }) {
  const res = await db.query(
    `INSERT INTO articles (title, category_id, group_id, publish_date, markdown_text)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, category_id, group_id, publish_date, markdown_text]  // Добавили markdown_text
  );
  return res.rows[0];
}

async function getArticleById(id) {
  const res = await db.query(`SELECT * FROM articles WHERE id = $1`, [id]);
  return res.rows[0];
}

async function updateArticle(id, { title, category_id, group_id, publish_date, markdown_text }) {
  const res = await db.query(
    `UPDATE articles SET
      title = COALESCE($1, title),
      category_id = COALESCE($2, category_id),
      group_id = COALESCE($3, group_id),
      publish_date = COALESCE($4, publish_date),
      markdown_text = COALESCE($5, markdown_text),  // Добавили markdown_text
      updated_at = now()
     WHERE id = $6 RETURNING *`,
    [title, category_id, group_id, publish_date, markdown_text, id]  // Добавили markdown_text
  );
  return res.rows[0];
}

async function deleteArticle(id) {
  // Удаляем версии статьи
  await db.query(`DELETE FROM article_versions WHERE article_id = $1`, [id]);
  // Удаляем связи с тегами
  await db.query(`DELETE FROM article_tags WHERE article_id = $1`, [id]);
  // Удаляем саму статью
  const res = await db.query(`DELETE FROM articles WHERE id = $1 RETURNING *`, [id]);
  return res.rows[0];
}

// Получение списка с фильтрами, пагинацией и сортировкой
async function getArticles({ categoryId, groupId, searchText, publishStatus, page = 1, perPage = 20, sortField = 'publish_date', sortOrder = 'DESC' }) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (categoryId) {
    conditions.push(`category_id = $${idx++}`);
    values.push(categoryId);
  }

  if (groupId) {
    // Иерархия: групп с ID>=groupId видят статью
    conditions.push(`group_id <= $${idx++}`); // меньше или равно, т.к. большие ID = более высокий уровень доступа
    values.push(groupId);
  }

  if (publishStatus === 'published') {
    conditions.push(`publish_date IS NOT NULL AND publish_date <= now()`);
  } else if (publishStatus === 'draft') {
    conditions.push(`publish_date IS NULL`);
  } else if (publishStatus === 'scheduled') {
    conditions.push(`publish_date > now()`);
  }

  if (searchText) {
    conditions.push(`title ILIKE $${idx++}`);
    values.push(`%${searchText}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * perPage;

  const query = `
    SELECT * FROM articles
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  values.push(perPage, offset);

  const res = await db.query(query, values);
  return res.rows;
}

async function countArticles({ categoryId, groupId, searchText, publishStatus }) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (categoryId) {
    conditions.push(`category_id = $${idx++}`);
    values.push(categoryId);
  }

  if (groupId) {
    conditions.push(`group_id <= $${idx++}`);
    values.push(groupId);
  }

  if (publishStatus === 'published') {
    conditions.push(`publish_date IS NOT NULL AND publish_date <= now()`);
  } else if (publishStatus === 'draft') {
    conditions.push(`publish_date IS NULL`);
  } else if (publishStatus === 'scheduled') {
    conditions.push(`publish_date > now()`);
  }

  if (searchText) {
    conditions.push(`title ILIKE $${idx++}`);
    values.push(`%${searchText}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `SELECT COUNT(*) FROM articles ${whereClause}`;

  const res = await db.query(query, values);
  return parseInt(res.rows[0].count, 10);
}

module.exports = {
  createArticle,
  getArticleById,
  updateArticle,
  deleteArticle,
  getArticles,
  countArticles,
};
