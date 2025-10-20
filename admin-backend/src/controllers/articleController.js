const db = require('../config/dbArticles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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
    fileSize: 50 * 1024 * 1024, // 50MB лимит
  }
});

// Функция для оптимизации изображения
async function optimizeImage(originalPath, filename) {
  console.log('=== DEBUG optimizeImage START ===');
  console.log('Original path:', originalPath);
  console.log('Filename:', filename);
  
  try {
    const fileExt = path.extname(filename);
    const baseName = path.basename(filename, fileExt);
    
    console.log('File extension:', fileExt);
    console.log('Base name:', baseName);
    
    const optimizedFilename = `${baseName}-optimized${fileExt}`;
    const thumbnailFilename = `${baseName}-thumbnail${fileExt}`;
    const originalFilename = `${baseName}-original${fileExt}`;
    
    const uploadDir = path.dirname(originalPath);
    
    console.log('Generated filenames:', {
      optimized: optimizedFilename,
      thumbnail: thumbnailFilename,
      original: originalFilename
    });
    
    // Проверяем что оригинальный файл существует
    if (!fs.existsSync(originalPath)) {
      throw new Error(`Original file not found: ${originalPath}`);
    }

    // Переименовываем оригинальный файл
    const originalPathNew = path.join(uploadDir, originalFilename);
    console.log('Renaming original file to:', originalPathNew);
    
    fs.renameSync(originalPath, originalPathNew);
    
    // Проверяем что файл изображение
    const isImage = fileExt.match(/\.(jpg|jpeg|png|webp)$/i);
    console.log('Is image:', isImage);
    
    if (isImage) {
      console.log('Starting image optimization...');
      
      // Создаем оптимизированную версию (макс. 1200px, качество 80%)
      console.log('Creating optimized version...');
      const optimizedBuffer = await sharp(originalPathNew)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 80,
          mozjpeg: true 
        })
        .toBuffer();
      
      console.log('Optimized buffer size:', optimizedBuffer.length);
      
      // Создаем thumbnail (150px)
      console.log('Creating thumbnail...');
      const thumbnailBuffer = await sharp(originalPathNew)
        .resize(150, 150, {
          fit: 'cover'
        })
        .jpeg({ 
          quality: 70 
        })
        .toBuffer();
      
      console.log('Thumbnail buffer size:', thumbnailBuffer.length);
      
      // Сохраняем оптимизированные версии
      const optimizedPath = path.join(uploadDir, optimizedFilename);
      const thumbnailPath = path.join(uploadDir, thumbnailFilename);
      
      console.log('Saving optimized version to:', optimizedPath);
      await sharp(optimizedBuffer).toFile(optimizedPath);
      
      console.log('Saving thumbnail to:', thumbnailPath);
      await sharp(thumbnailBuffer).toFile(thumbnailPath);
      
      // Проверяем что файлы создались
      console.log('Checking if files were created...');
      console.log('Optimized exists:', fs.existsSync(optimizedPath));
      console.log('Thumbnail exists:', fs.existsSync(thumbnailPath));
      
      // Получаем информацию о размерах
      const originalMeta = await sharp(originalPathNew).metadata();
      const optimizedMeta = await sharp(optimizedBuffer).metadata();
      const thumbnailMeta = await sharp(thumbnailBuffer).metadata();
      
      const result = {
        original: originalFilename,
        optimized: optimizedFilename,
        thumbnail: thumbnailFilename,
        sizes: {
          original: {
            width: originalMeta.width,
            height: originalMeta.height,
            size: fs.statSync(originalPathNew).size
          },
          optimized: {
            width: optimizedMeta.width,
            height: optimizedMeta.height,
            size: optimizedBuffer.length
          },
          thumbnail: {
            width: thumbnailMeta.width,
            height: thumbnailMeta.height,
            size: thumbnailBuffer.length
          }
        }
      };
      
      console.log('Optimization result:', result);
      console.log('=== DEBUG optimizeImage SUCCESS ===');
      return result;
      
    } else {
      // Для не-изображений просто переименовываем
      console.log('Non-image file, skipping optimization');
      const result = {
        original: originalFilename,
        optimized: originalFilename, // используем тот же файл
        thumbnail: originalFilename,
        sizes: {
          original: { size: fs.statSync(originalPathNew).size },
          optimized: { size: fs.statSync(originalPathNew).size },
          thumbnail: { size: fs.statSync(originalPathNew).size }
        }
      };
      
      console.log('Non-image result:', result);
      console.log('=== DEBUG optimizeImage SUCCESS (non-image) ===');
      return result;
    }
    
  } catch (error) {
    console.error('=== DEBUG optimizeImage ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Метод для загрузки файлов
exports.uploadFiles = async (req, res) => {
  console.log('=== DEBUG: uploadFiles called ===');
  
  try {
    // Используем multer middleware для обработки загрузки
    upload.array('files', 10)(req, res, async function (err) {
      console.log('=== DEBUG: Inside multer callback ===');
      
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      console.log('=== DEBUG: Files received:', req.files ? req.files.length : 0);
      
      if (!req.files || req.files.length === 0) {
        console.log('=== DEBUG: No files uploaded ===');
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const uploadedFiles = [];

      try {
        for (const file of req.files) {
          console.log('=== DEBUG: Processing file:', file.originalname);
          console.log('=== DEBUG: File path:', file.path);
          console.log('=== DEBUG: File filename:', file.filename);
          
          // Оптимизируем изображение
          console.log('=== DEBUG: Calling optimizeImage ===');
          const optimizedResult = await optimizeImage(file.path, file.filename);
          console.log('=== DEBUG: optimizeImage completed:', optimizedResult);
          
          const fileInfo = {
            originalName: file.originalname,
            ...optimizedResult,
            mimetype: file.mimetype,
            uploadDate: new Date().toISOString()
          };

          uploadedFiles.push(fileInfo);
          console.log('=== DEBUG: File processed successfully');
        }

        console.log('=== DEBUG: All files processed, sending response');
        res.json({
          message: 'Files uploaded and optimized successfully',
          files: uploadedFiles,
          total: uploadedFiles.length
        });

      } catch (optimizeError) {
        console.error('=== DEBUG: Optimization error:', optimizeError);
        // Удаляем частично загруженные файлы в случае ошибки
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        res.status(500).json({ error: 'Error optimizing files' });
      }
    });
  } catch (error) {
    console.error('=== DEBUG: Outer catch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Методы для управления файлами
exports.getFilesList = async (req, res) => {
  try {
    const uploadDir = '/app/uploads/articles';
    const files = [];
    
    if (fs.existsSync(uploadDir)) {
      const fileNames = fs.readdirSync(uploadDir);
      
      // Фильтруем только optimized файлы для списка
      const optimizedFiles = fileNames.filter(name => name.includes('-optimized.'));
      
      for (const fileName of optimizedFiles) {
        const filePath = path.join(uploadDir, fileName);
        const stats = fs.statSync(filePath);
        
        // Получаем базовое имя для поиска связанных файлов
        const baseName = fileName.replace('-optimized', '');
        const originalName = fileNames.find(name => name.includes(baseName.replace(path.extname(baseName), '-original' + path.extname(baseName))));
        const thumbnailName = fileNames.find(name => name.includes(baseName.replace(path.extname(baseName), '-thumbnail' + path.extname(baseName))));
        
        files.push({
          filename: fileName,
          originalName: originalName || fileName,
          thumbnailName: thumbnailName || fileName,
          size: stats.size,
          mimetype: getMimeType(fileName),
          uploadDate: stats.birthtime,
          url: `/uploads/articles/${fileName}`,
          originalUrl: `/uploads/articles/${originalName}`,
          thumbnailUrl: `/uploads/articles/${thumbnailName}`
        });
      }
    }
    
    // Сортируем по дате создания (новые сверху)
    files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    res.json({ files });
  } catch (error) {
    console.error('Error getting files list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = '/app/uploads/articles';
    
    // Получаем базовое имя для удаления всех версий
    const baseName = filename.replace('-optimized', '').replace('-original', '').replace('-thumbnail', '');
    const baseNameWithoutExt = baseName.replace(path.extname(baseName), '');
    
    const filesToDelete = [
      `${baseNameWithoutExt}-original${path.extname(baseName)}`,
      `${baseNameWithoutExt}-optimized${path.extname(baseName)}`,
      `${baseNameWithoutExt}-thumbnail${path.extname(baseName)}`
    ];
    
    let deletedCount = 0;
    
    for (const fileToDelete of filesToDelete) {
      const filePath = path.join(uploadDir, fileToDelete);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      res.json({ 
        message: 'File and all versions deleted successfully',
        deletedCount: deletedCount
      });
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
    '.webp': 'image/webp',
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