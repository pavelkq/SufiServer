// admin-frontend/src/components/ArticleEdit/FileUploadSection.js
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
  ListItemIcon,
  Typography,
  LinearProgress,
  Chip,
} from '@mui/material';
import { InsertDriveFile, CloudUpload, Check, Error } from '@mui/icons-material';
import { useNotify } from 'react-admin';

const FileUploadSection = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const notify = useNotify();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    
    const initialStatus = {};
    files.forEach(file => {
      initialStatus[file.name] = 'pending';
    });
    setUploadStatus(initialStatus);
    setUploadProgress({});
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const uploadResults = [];

    try {
      for (const file of selectedFiles) {
        try {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const formData = new FormData();
          formData.append('files', file);

          // Используем XMLHttpRequest для отслеживания прогресса
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                setUploadProgress(prev => ({
                  ...prev,
                  [file.name]: Math.round(progress)
                }));
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                console.log('File uploaded successfully:', response);
                setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                uploadResults.push({ file: file.name, status: 'success' });
                resolve(response);
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Upload failed'));
            });

            xhr.open('POST', 'http://188.127.230.92:8090/api/admin-backend/articles/upload');
            
            const token = localStorage.getItem('token');
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            xhr.send(formData);
          });

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
      if (successfulUploads === selectedFiles.length) {
        notify('Все файлы успешно загружены', { type: 'success' });
      } else if (successfulUploads > 0) {
        notify(`Успешно загружено ${successfulUploads} из ${selectedFiles.length} файлов`, { 
          type: 'warning' 
        });
      } else {
        notify('Ошибка при загрузке всех файлов', { type: 'error' });
      }

    } catch (error) {
      console.error('General upload error:', error);
      notify('Произошла ошибка при загрузке файлов', { type: 'error' });
    } finally {
      setUploading(false);
      setUploadDialogOpen(false);
      setSelectedFiles([]);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Check color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'uploading':
        return <CloudUpload color="primary" />;
      default:
        return <InsertDriveFile />;
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

  const allUploadsFinished = uploading === false && 
    Object.values(uploadStatus).every(status => status === 'success' || status === 'error');

  return (
    <Box sx={{ mt: 3 }}>
      <Button
        variant="outlined"
        startIcon={<CloudUpload />}
        onClick={() => setUploadDialogOpen(true)}
      >
        Загрузить файлы
      </Button>

      <Dialog open={uploadDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Загрузка файлов</DialogTitle>
        <DialogContent>
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
                    <ListItemIcon>
                      {getStatusIcon(uploadStatus[file.name])}
                    </ListItemIcon>
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
                            Размер: {(file.size / 1024).toFixed(1)} KB
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
            {uploading ? 'Отмена (ждём)' : (allUploadsFinished ? 'Закрыть' : 'Отмена')}
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={selectedFiles.length === 0 || uploading}
            startIcon={uploading ? <CloudUpload /> : null}
          >
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUploadSection;