const db = require('../config/dbArticles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ИСПРАВЛЕННЫЙ ПУТЬ - должен совпадать с volume в docker-compose
    const uploadDir = '/app/uploads/articles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, fileName + '-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB лимит вместо 10MB
  }
});

// Методы для управления файлами
exports.getFilesList = async (req, res) => {
  try {
    const uploadDir = '/app/uploads/articles';
    const files = [];
    
    if (fs.existsSync(uploadDir)) {
      const fileNames = fs.readdirSync(uploadDir);
      
      for (const fileName of fileNames) {
        const filePath = path.join(uploadDir, fileName);
        const stats = fs.statSync(filePath);
        
        files.push({
          filename: fileName,
          originalName: fileName, // В реальной системе нужно хранить оригинальные имена
          size: stats.size,
          mimetype: getMimeType(fileName),
          uploadDate: stats.birthtime,
          url: `/uploads/articles/${fileName}`
        });
      }
    }
    
    res.json({ files });
  } catch (error) {
    console.error('Error getting files list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join('/app/uploads/articles', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Вспомогательная функция для определения MIME типа
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Метод для загрузки файлов
exports.uploadFiles = async (req, res) => {
  try {
    // Используем multer middleware для обработки загрузки
    upload.array('files', 10)(req, res, async function (err) {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      // Обрабатываем загруженные файлы
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: `/uploads/articles/${file.filename}`
      }));

      console.log('Successfully uploaded files:', uploadedFiles.map(f => f.originalName));
      console.log('Files saved to:', req.files.map(f => f.path));

      res.json({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
        total: uploadedFiles.length
      });
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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
      [title, category_id, group_id, publish_date, markdown_text || '']
    );

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

    if (markdown_text) {
      const currentVersion = await db.query(
        'SELECT markdown_text FROM article_versions WHERE article_id = $1 ORDER BY created_at DESC LIMIT 1',
        [id]
      );

      if (!currentVersion.rows.length || currentVersion.rows[0].markdown_text !== markdown_text) {
        await db.query(
          `INSERT INTO article_versions (article_id, markdown_text, html_text) 
           VALUES ($1, $2, $3)`,
          [id, markdown_text, markdown_text]
        );

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

    const result = await db.query(
      `UPDATE articles 
       SET title = $1, category_id = $2, group_id = $3, publish_date = $4, 
           markdown_text = $5, updated_at = NOW() 
       WHERE id = $6 RETURNING *`,
      [title, category_id, group_id, publish_date, markdown_text || '', id]
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