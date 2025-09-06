const db = require('../config/dbArticles');

// Методы для статей
exports.listArticles = async (req, res) => {
  try {
    const { page = 1, perPage = 10, sortField = 'created_at', sortOrder = 'DESC', filter } = req.query;
    const offset = (page - 1) * perPage;
    
    let whereClause = '';
    let queryParams = [perPage, offset];
    let paramCount = 2;

    if (filter) {
      const filterObj = typeof filter === 'string' ? JSON.parse(filter) : filter;
      if (filterObj.title) {
        paramCount++;
        whereClause += ` AND title ILIKE $${paramCount}`;
        queryParams.push(`%${filterObj.title}%`);
      }
      if (filterObj.content) {
        paramCount++;
        whereClause += ` AND markdown_text ILIKE $${paramCount}`;
        queryParams.push(`%${filterObj.content}%`);
      }
      if (filterObj.category_id) {
        paramCount++;
        whereClause += ` AND category_id = $${paramCount}`;
        queryParams.push(parseInt(filterObj.category_id));
      }
    }

    const result = await db.query(
      `SELECT *, COUNT(*) OVER() as total_count 
       FROM articles 
       WHERE 1=1 ${whereClause}
       ORDER BY ${sortField} ${sortOrder} 
       LIMIT $1 OFFSET $2`,
      queryParams
    );

    const total = result.rows[0] ? parseInt(result.rows[0].total_count) : 0;

    res.json({
      data: result.rows,
      total: total
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Защита от строковых ID типа "categories"
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }
    
    const result = await db.query(
      'SELECT * FROM articles WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createNewArticle = async (req, res) => {
  try {
    const { title, category_id, group_id, publish_date, markdown_text } = req.body;
    
    const result = await db.query(
      `INSERT INTO articles (title, category_id, group_id, publish_date, markdown_text) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, category_id, group_id, publish_date, markdown_text || '']  // Добавили markdown_text
    );

    // Создаем первую версию статьи
    if (markdown_text) {
      await db.query(
        `INSERT INTO article_versions (article_id, markdown_text, html_text) 
         VALUES ($1, $2, $3)`,
        [result.rows[0].id, markdown_text, markdown_text]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateArticleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category_id, group_id, publish_date, markdown_text } = req.body;

    // Проверяем, изменился ли контент для создания новой версии
    if (markdown_text) {
      const currentVersion = await db.query(
        'SELECT markdown_text FROM article_versions WHERE article_id = $1 ORDER BY created_at DESC LIMIT 1',
        [id]
      );

      if (!currentVersion.rows.length || currentVersion.rows[0].markdown_text !== markdown_text) {
        // Создаем новую версию
        await db.query(
          `INSERT INTO article_versions (article_id, markdown_text, html_text) 
           VALUES ($1, $2, $3)`,
          [id, markdown_text, markdown_text]
        );

        // Удаляем старые версии (оставляем 3 последние)
        await db.query(
          `DELETE FROM article_versions 
           WHERE article_id = $1 AND id NOT IN (
             SELECT id FROM article_versions 
             WHERE article_id = $1 
             ORDER BY created_at DESC 
             LIMIT 3
           )`,
          [id]
        );
      }
    }

    // Обновляем статью (ДОБАВИЛИ markdown_text!)
    const result = await db.query(
      `UPDATE articles 
       SET title = $1, category_id = $2, group_id = $3, publish_date = $4, 
           markdown_text = $5, updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [title, category_id, group_id, publish_date, markdown_text || '', id]  // Добавили markdown_text
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteArticleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Удаляем связанные данные
    await db.query('DELETE FROM article_tags WHERE article_id = $1', [id]);
    await db.query('DELETE FROM article_versions WHERE article_id = $1', [id]);
    
    const result = await db.query(
      'DELETE FROM articles WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Методы для категорий
exports.listCategories = async (req, res) => {
  try {
    console.log('Fetching categories from database...');
    
    // Проверим подключение к базе
    try {
      const testResult = await db.query('SELECT NOW() as current_time');
      console.log('Database connection OK:', testResult.rows[0].current_time);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: dbError.message 
      });
    }
    
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    console.log(`Found ${result.rows.length} categories`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      query: 'SELECT * FROM categories ORDER BY name'
    });
  }
};

exports.createNewCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await db.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCategoryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли статьи в категории
    const articlesCount = await db.query(
      'SELECT COUNT(*) FROM articles WHERE category_id = $1',
      [id]
    );
    
    if (parseInt(articlesCount.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with articles' });
    }
    
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Методы для тегов
exports.listTags = async (req, res) => {
  try {
    console.log('Fetching tags from database...');
    
    const result = await db.query('SELECT * FROM tags ORDER BY name');
    console.log(`Found ${result.rows.length} tags`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      query: 'SELECT * FROM tags ORDER BY name'
    });
  }
};

exports.createNewTag = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query(
      'INSERT INTO tags (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateTagHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await db.query(
      'UPDATE tags SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteTagHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, используется ли тег в статьях
    const usageCount = await db.query(
      'SELECT COUNT(*) FROM article_tags WHERE tag_id = $1',
      [id]
    );
    
    if (parseInt(usageCount.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete tag used in articles' });
    }
    
    const result = await db.query(
      'DELETE FROM tags WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getArticleTags = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT t.* FROM tags t
       JOIN article_tags at ON t.id = at.tag_id
       WHERE at.article_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching article tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createArticleTag = async (req, res) => {
  try {
    const { article_id, tag_id } = req.body;
    await db.query(
      'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2)',
      [article_id, tag_id]
    );
    res.status(201).json({ message: 'Tag added to article' });
  } catch (error) {
    console.error('Error adding tag to article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteArticleTag = async (req, res) => {
  try {
    const { article_id, tag_id } = req.body;
    await db.query(
      'DELETE FROM article_tags WHERE article_id = $1 AND tag_id = $2',
      [article_id, tag_id]
    );
    res.json({ message: 'Tag removed from article' });
  } catch (error) {
    console.error('Error removing tag from article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Метод для загрузки файлов
exports.uploadFiles = async (req, res) => {
  try {
    // Здесь будет реализация загрузки файлов
    // Пока возвращаем заглушку
    res.status(501).json({ error: 'File upload not implemented yet' });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
