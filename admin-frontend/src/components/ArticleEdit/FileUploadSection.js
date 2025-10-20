import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import { useNotify } from 'react-admin';

// Простые иконки как компоненты React чтобы избежать проблем с импортом
const FileIcon = () => <span>📄</span>;
const UploadIcon = () => <span>⬆️</span>;
const SuccessIcon = () => <span>✅</span>;
const ErrorIcon = () => <span>❌</span>;
const FolderIcon = () => <span>📁</span>;

const FileUploadSection = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const notify = useNotify();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Проверяем размер файлов
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const oversizedNames = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(', ');
      notify(`Слишком большие файлы (макс. 50MB): ${oversizedNames}`, { type: 'error' });
      
      // Оставляем только файлы допустимого размера
      const validFiles = files.filter(file => file.size <= 50 * 1024 * 1024);
      setSelectedFiles(validFiles);
    } else {
      setSelectedFiles(files);
    }
    
    const initialStatus = {};
    files.forEach(file => {
      if (file.size <= 50 * 1024 * 1024) {
        initialStatus[file.name] = 'pending';
      }
    });
    setUploadStatus(initialStatus);
    setUploadProgress({});
  };

// Функция для вставки файла в редактор
const insertFileIntoEditor = (file, fileInfo) => {
  console.log('=== DEBUG: Starting file insertion ===');
  console.log('File:', file.name, 'File info:', fileInfo);
  
  const editor = window.currentEditor;
  if (!editor) {
    console.error('❌ Editor not available!');
    notify('Редактор не доступен для вставки файла. Убедитесь что редактор загружен.', { type: 'warning' });
    return;
  }

  console.log('✅ Editor is available, inserting content...');
  
  // Используем оптимизированную версию для изображений
  const fileName = fileInfo.optimized || fileInfo.filename;
  const fileUrl = `http://188.127.230.92:8090/uploads/articles/${fileName}`;
  const safeAlt = file.name.replace(/-/g, '_').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  
  if (file.type && file.type.startsWith('image/')) {
    // Для изображений вставляем оптимизированную версию
    const content = `<img src="${fileUrl}" alt="${safeAlt}" style="max-width: 100%; height: auto;" />`;
    console.log('Inserting optimized image:', content);
    editor.commands.insertContent(content);
    console.log('✅ Оптимизированное изображение вставлено в редактор:', file.name);
  } else {
    // Для других файлов вставляем ссылку на оригинал
    const content = `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${file.name}</a>`;
    console.log('Inserting file link:', content);
    editor.commands.insertContent(content);
    console.log('✅ Файл вставлен в редактор:', file.name);
  }
  
  console.log('=== DEBUG: File insertion completed ===');
};

const handleUpload = async () => {
  if (selectedFiles.length === 0) return;

  setUploading(true);
  const uploadResults = [];
  const insertedFiles = [];

  try {
    for (const file of selectedFiles) {
      try {
        // Проверяем размер файла на фронтенде
        if (file.size > 50 * 1024 * 1024) {
          throw new Error(`Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(1)}MB. Максимальный размер: 50MB`);
        }

        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch('http://188.127.230.92:8090/api/admin-backend/articles/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });

        if (!response.ok) {
          let errorMessage = `Ошибка загрузки: ${response.status}`;
          try {
            const errorResponse = await response.json();
            if (errorResponse.error) {
              errorMessage = errorResponse.error;
            }
          } catch (e) {
            // Если не удалось распарсить JSON, используем стандартное сообщение
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();

        // ОТЛАДОЧНЫЙ КОД ДЛЯ ПРОВЕРКИ СТРУКТУРЫ ОТВЕТА
        console.log('=== DEBUG: Server response ===', result);
        console.log('=== DEBUG: First file info ===', result.files && result.files[0]);

        console.log('File uploaded and optimized successfully:', result);
        
        // Автоматически вставляем файл в редактор после успешной загрузки
        if (result.files && result.files[0]) {
          const uploadedFileInfo = result.files[0];
          insertFileIntoEditor(file, uploadedFileInfo);
          insertedFiles.push(file.name);
        }
        
        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        uploadResults.push({ file: file.name, status: 'success' });

      } catch (error) {
        console.error(`Ошибка загрузки файла ${file.name}:`, error);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        uploadResults.push({ 
          file: file.name, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    // ... остальной код функции
  } catch (error) {
    console.error('General upload error:', error);
    notify(`Произошла ошибка при загрузке файлов: ${error.message}`, { type: 'error' });
  } finally {
    setUploading(false);
    setUploadDialogOpen(false);
    setSelectedFiles([]);
  }
};

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'uploading':
        return <UploadIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'uploading': return 'primary';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return 'успешно';
      case 'error': return 'ошибка';
      case 'uploading': return 'загрузка';
      default: return 'ожидание';
    }
  };

  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    if (!uploading) {
      setSelectedFiles([]);
      setUploadProgress({});
      setUploadStatus({});
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Загрузить файлы
        </Button>

        <Tooltip title="Выбрать из загруженных файлов">
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => {/* будет реализовано позже */}}
          >
            Менеджер файлов
          </Button>
        </Tooltip>
      </Box>

      {/* Диалог загрузки файлов */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Загрузка файлов</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Файлы будут автоматически оптимизированы и вставлены в статью. 
            Изображения сжимаются до 1200px с сохранением качества.
            Максимальный размер: 50MB
          </Typography>
          
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload-input"
            disabled={uploading}
          />
          <label htmlFor="file-upload-input">
            <Button 
              variant="contained" 
              component="span" 
              fullWidth
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              Выбрать файлы
            </Button>
          </label>

          {selectedFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Выбранные файлы ({selectedFiles.length}):
              </Typography>
              <List dense>
                {selectedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <Box sx={{ mr: 2 }}>
                      {getStatusIcon(uploadStatus[file.name])}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                            {file.name}
                          </Typography>
                          <Chip 
                            label={getStatusText(uploadStatus[file.name])}
                            size="small"
                            color={getStatusColor(uploadStatus[file.name])}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block">
                            Размер: {(file.size / 1024 / 1024).toFixed(1)} MB • 
                            Тип: {file.type || 'неизвестен'}
                          </Typography>
                          {uploadStatus[file.name] === 'uploading' && (
                            <LinearProgress 
                              variant="determinate" 
                              value={uploadProgress[file.name] || 0}
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            disabled={uploading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={selectedFiles.length === 0 || uploading}
            startIcon={uploading ? <UploadIcon /> : null}
          >
            {uploading ? 'Загрузка и оптимизация...' : 'Загрузить и оптимизировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUploadSection;