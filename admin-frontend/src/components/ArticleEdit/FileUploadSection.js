import React, { useState, useEffect } from 'react';
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
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { useNotify } from 'react-admin';
import { Delete, Image, InsertDriveFile, FolderOpen } from '@mui/icons-material';

// Простые иконки как компоненты React чтобы избежать проблем с импортом
const FileIcon = () => <span>📄</span>;
const UploadIcon = () => <span>⬆️</span>;
const SuccessIcon = () => <span>✅</span>;
const ErrorIcon = () => <span>❌</span>;
const FolderIcon = () => <span>📁</span>;

const FileUploadSection = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [filesList, setFilesList] = useState([]);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const notify = useNotify();

  // Тестирование endpoint'а
  const testEndpoint = async () => {
    try {
      console.log('🧪 TEST: Testing endpoint connectivity');
      const token = localStorage.getItem('token') || '';
      console.log('🧪 TEST: Token length:', token.length);
      
      // Тест 1: Без авторизации
      try {
        const test1 = await fetch('http://188.127.230.92:8090/api/admin-backend/articles/files');
        console.log('🧪 TEST: Without auth - Status:', test1.status);
      } catch (e) {
        console.log('🧪 TEST: Without auth - Error:', e.message);
      }
      
      // Тест 2: С авторизацией
      try {
        const test2 = await fetch('http://188.127.230.92:8090/api/admin-backend/articles/files', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('🧪 TEST: With auth - Status:', test2.status);
        
        if (!test2.ok) {
          const errorText = await test2.text();
          console.log('🧪 TEST: Error response:', errorText);
        }
      } catch (e) {
        console.log('🧪 TEST: With auth - Error:', e.message);
      }
      
    } catch (error) {
      console.error('🧪 TEST: General error:', error);
    }
  };

  // Загрузка списка файлов с детальной отладкой
  const loadFilesList = async () => {
    setLoadingFiles(true);
    try {
      const token = localStorage.getItem('token') || '';
      console.log('🔍 DEBUG: Starting loadFilesList');
      console.log('🔍 DEBUG: Token exists:', !!token);
      console.log('🔍 DEBUG: Token length:', token.length);
      console.log('🔍 DEBUG: Token first 20 chars:', token.substring(0, 20) + '...');
      
      const response = await fetch('http://188.127.230.92:8090/api/admin-backend/articles/files', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('🔍 DEBUG: Response status:', response.status);
      console.log('🔍 DEBUG: Response ok:', response.ok);
      console.log('🔍 DEBUG: Response status text:', response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔍 DEBUG: Response data:', result);
        console.log('🔍 DEBUG: Files count:', result.files ? result.files.length : 0);
        
        if (result.files && Array.isArray(result.files)) {
          setFilesList(result.files);
          notify(`Загружено файлов: ${result.files.length}`, { type: 'success' });
        } else {
          console.log('🔍 DEBUG: No files array in response, setting empty array');
          setFilesList([]);
        }
      } else {
        // Пытаемся получить детальную ошибку от сервера
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails = '';
        
        try {
          const errorData = await response.text();
          console.error('🔍 DEBUG: Error response body:', errorData);
          
          if (errorData) {
            try {
              const parsedError = JSON.parse(errorData);
              errorMessage = parsedError.error || parsedError.message || errorMessage;
              errorDetails = JSON.stringify(parsedError, null, 2);
            } catch (parseError) {
              errorMessage = errorData.substring(0, 100) + '...';
              errorDetails = errorData;
            }
          }
        } catch (e) {
          console.error('🔍 DEBUG: Cannot read error response:', e);
        }
        
        console.error('🔍 DEBUG: Full error details:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails
        });
        
        // Временное решение - используем mock данные для тестирования UI
        console.log('🔍 DEBUG: Using mock data for UI testing');
        const mockFiles = [
          {
            filename: 'test-image-optimized.jpg',
            originalName: 'test-image.jpg',
            thumbnailName: 'test-image-thumbnail.jpg',
            size: 1024000,
            mimetype: 'image/jpeg',
            uploadDate: new Date().toISOString(),
            optimized: 'test-image-optimized.jpg'
          },
          {
            filename: 'document.pdf',
            originalName: 'important-document.pdf',
            thumbnailName: 'document.pdf',
            size: 2048000,
            mimetype: 'application/pdf',
            uploadDate: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setFilesList(mockFiles);
        
        notify(`Ошибка загрузки с сервера, показаны тестовые данные. Ошибка: ${errorMessage}`, { type: 'warning' });
      }
    } catch (error) {
      console.error('🔍 DEBUG: Network error:', error);
      
      // Временное решение при сетевой ошибке
      const mockFiles = [
        {
          filename: 'network-error-optimized.jpg',
          originalName: 'network-error.jpg',
          thumbnailName: 'network-error-thumbnail.jpg',
          size: 512000,
          mimetype: 'image/jpeg',
          uploadDate: new Date().toISOString(),
          optimized: 'network-error-optimized.jpg'
        }
      ];
      setFilesList(mockFiles);
      
      notify(`Сетевая ошибка, показаны тестовые данные. Ошибка: ${error.message}`, { type: 'warning' });
    } finally {
      setLoadingFiles(false);
    }
  };

  // Удаление выбранных файлов
  const handleDeleteFiles = async () => {
    if (selectedFileIds.length === 0) return;

    try {
      for (const filename of selectedFileIds) {
        const response = await fetch(`http://188.127.230.92:8090/api/admin-backend/articles/files/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Ошибка удаления файла: ${filename}`);
        }
      }

      notify(`Удалено файлов: ${selectedFileIds.length}`, { type: 'success' });
      setSelectedFileIds([]);
      loadFilesList(); // Перезагружаем список
    } catch (error) {
      console.error('Error deleting files:', error);
      notify(error.message, { type: 'error' });
    }
  };

  // Вставка файла в редактор
  const insertFileIntoEditor = (fileInfo) => {
    console.log('=== DEBUG: Starting file insertion ===');
    console.log('File info:', fileInfo);
    
    const editor = window.currentEditor;
    if (!editor) {
      console.error('❌ Editor not available!');
      notify('Редактор не доступен для вставки файла. Убедитесь что редактор загружен.', { type: 'warning' });
      return;
    }

    console.log('✅ Editor is available, inserting content...');
    
    const fileName = fileInfo.optimized || fileInfo.filename;
    const fileUrl = `http://188.127.230.92:8090/uploads/articles/${fileName}`;
    const safeAlt = fileInfo.originalName.replace(/-/g, '_').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
    
    if (fileInfo.mimetype && fileInfo.mimetype.startsWith('image/')) {
      const content = `<img src="${fileUrl}" alt="${safeAlt}" style="max-width: 100%; height: auto;" />`;
      console.log('Inserting optimized image:', content);
      editor.commands.insertContent(content);
      console.log('✅ Изображение вставлено в редактор:', fileInfo.originalName);
      notify('Изображение вставлено в статью', { type: 'success' });
    } else {
      const content = `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer">${fileInfo.originalName}</a>`;
      console.log('Inserting file link:', content);
      editor.commands.insertContent(content);
      console.log('✅ Файл вставлен в редактор:', fileInfo.originalName);
      notify('Ссылка на файл вставлена в статью', { type: 'success' });
    }
    
    setFileManagerOpen(false);
  };

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

          console.log('=== DEBUG: Server response ===', result);
          console.log('=== DEBUG: First file info ===', result.files && result.files[0]);

          console.log('File uploaded and optimized successfully:', result);
          
          // Автоматически вставляем файл в редактор после успешной загрузки
          if (result.files && result.files[0]) {
            const uploadedFileInfo = result.files[0];
            insertFileIntoEditor(uploadedFileInfo);
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

      // Показываем результаты
      const successfulUploads = uploadResults.filter(r => r.status === 'success').length;
      const insertedCount = insertedFiles.length;
      
      if (successfulUploads === selectedFiles.length) {
        if (insertedCount > 0) {
          notify(`Все файлы (${insertedCount}) успешно загружены, оптимизированы и вставлены в статью`, { type: 'success' });
        } else {
          notify('Все файлы успешно загружены и оптимизированы', { type: 'success' });
        }
      } else if (successfulUploads > 0) {
        if (insertedCount > 0) {
          notify(`Успешно загружено ${successfulUploads} из ${selectedFiles.length} файлов, ${insertedCount} вставлено в статью`, { 
            type: 'warning' 
          });
        } else {
          notify(`Успешно загружено ${successfulUploads} из ${selectedFiles.length} файлов`, { 
            type: 'warning' 
          });
        }
      } else {
        const errorMessages = uploadResults.filter(r => r.status === 'error').map(r => `${r.file}: ${r.error}`);
        notify(`Ошибка при загрузке всех файлов: ${errorMessages.join('; ')}`, { type: 'error' });
      }

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

  const handleCloseFileManager = () => {
    setFileManagerOpen(false);
    setSelectedFileIds([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFileCheckboxChange = (filename, checked) => {
    if (checked) {
      setSelectedFileIds(prev => [...prev, filename]);
    } else {
      setSelectedFileIds(prev => prev.filter(id => id !== filename));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFileIds(filesList.map(file => file.filename));
    } else {
      setSelectedFileIds([]);
    }
  };

  // Тестирование при монтировании компонента
  useEffect(() => {
    console.log('🔍 FileUploadSection mounted');
    testEndpoint();
  }, []);

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

        <Button
          variant="outlined"
          startIcon={<FolderOpen />}
          onClick={() => {
            setFileManagerOpen(true);
            loadFilesList();
          }}
        >
          Менеджер файлов
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={testEndpoint}
        >
          Тестировать подключение
        </Button>
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

      {/* Диалог менеджера файлов */}
      <Dialog open={fileManagerOpen} onClose={handleCloseFileManager} maxWidth="lg" fullWidth>
        <DialogTitle>
          Менеджер файлов
          <Typography variant="body2" color="text.secondary">
            Управление загруженными файлами
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedFileIds.length === filesList.length && filesList.length > 0}
                  indeterminate={selectedFileIds.length > 0 && selectedFileIds.length < filesList.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label="Выбрать все"
            />
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Выбрано: {selectedFileIds.length}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteFiles}
                disabled={selectedFileIds.length === 0}
                size="small"
              >
                Удалить выбранные
              </Button>
            </Box>
          </Box>

          {loadingFiles ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Загрузка файлов...</Typography>
            </Box>
          ) : filesList.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography color="text.secondary">
                Нет загруженных файлов
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filesList.map((file) => (
                <Grid item xs={12} sm={6} md={4} key={file.filename}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <Box sx={{ position: 'relative' }}>
                      <Checkbox
                        checked={selectedFileIds.includes(file.filename)}
                        onChange={(e) => handleFileCheckboxChange(file.filename, e.target.checked)}
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          zIndex: 1,
                          backgroundColor: 'rgba(255,255,255,0.8)'
                        }}
                      />
                      
                      {file.mimetype && file.mimetype.startsWith('image/') ? (
                        <CardMedia
                          component="img"
                          height="140"
                          image={`http://188.127.230.92:8090/uploads/articles/${file.thumbnailName || file.filename}`}
                          alt={file.originalName}
                          sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                          onError={(e) => {
                            console.log('❌ Image load error:', file.thumbnailName || file.filename);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `
                              <div style="height: 140px; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                                <span style="font-size: 48px;">🖼️</span>
                              </div>
                            `;
                          }}
                        />
                      ) : (
                        <Box sx={{ 
                          height: 140, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: '#f5f5f5'
                        }}>
                          <InsertDriveFile sx={{ fontSize: 48, color: 'text.secondary' }} />
                        </Box>
                      )}
                    </Box>
                    
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="body2" noWrap title={file.originalName}>
                        {file.originalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatFileSize(file.size)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(file.uploadDate)}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p: 1.5, pt: 0 }}>
                      <Button 
                        size="small" 
                        onClick={() => insertFileIntoEditor(file)}
                        startIcon={file.mimetype && file.mimetype.startsWith('image/') ? <Image /> : <InsertDriveFile />}
                      >
                        Вставить
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFileManager}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUploadSection;