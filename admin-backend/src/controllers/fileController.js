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
    const fileExt = path.extname(filename).toLowerCase();
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
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(fileExt);
    console.log('Is image:', isImage);
    
    if (isImage) {
      console.log('Starting image optimization...');
      
      // Создаем оптимизированную версию (макс. 1200px, качество 80%)
      console.log('Creating optimized version...');
      await sharp(originalPathNew)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 80,
          mozjpeg: true 
        })
        .toFile(path.join(uploadDir, optimizedFilename));
      
      // Создаем thumbnail (150px)
      console.log('Creating thumbnail...');
      await sharp(originalPathNew)
        .resize(150, 150, {
          fit: 'cover'
        })
        .jpeg({ 
          quality: 70 
        })
        .toFile(path.join(uploadDir, thumbnailFilename));
      
      // Проверяем что файлы создались
      console.log('Checking if files were created...');
      console.log('Optimized exists:', fs.existsSync(path.join(uploadDir, optimizedFilename)));
      console.log('Thumbnail exists:', fs.existsSync(path.join(uploadDir, thumbnailFilename)));
      
      const result = {
        original: originalFilename,
        optimized: optimizedFilename,
        thumbnail: thumbnailFilename
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
        thumbnail: originalFilename
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

// Метод для загрузки файлов с оптимизацией
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
        res.status(500).json({ error: 'Error optimizing files: ' + optimizeError.message });
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
