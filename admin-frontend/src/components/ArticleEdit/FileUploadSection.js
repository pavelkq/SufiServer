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
} from '@mui/material';
import { InsertDriveFile, CloudUpload } from '@mui/icons-material';
import { useNotify } from 'react-admin';

const FileUploadSection = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const notify = useNotify();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    selectedFiles.forEach(file => {
      console.log('Загружаем файл:', file.name);
    });

    notify('Файлы готовы к загрузке', { type: 'info' });
    setUploadDialogOpen(false);
    setSelectedFiles([]);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Button
        variant="outlined"
        startIcon={<CloudUpload />}
        onClick={() => setUploadDialogOpen(true)}
      >
        Загрузить файлы
      </Button>

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Загрузка файлов</DialogTitle>
        <DialogContent>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input">
            <Button variant="contained" component="span" fullWidth>
              Выбрать файлы
            </Button>
          </label>

          {selectedFiles.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Выбранные файлы:</Typography>
              <List>
                {selectedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFile />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(1)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={selectedFiles.length === 0}
          >
            Загрузить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUploadSection;
