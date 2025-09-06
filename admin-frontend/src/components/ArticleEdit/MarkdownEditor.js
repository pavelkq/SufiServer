import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextareaAutosize,
} from '@mui/material';
import { useInput } from 'react-admin';

const MarkdownEditor = ({ source, label }) => {
  const { field } = useInput({ source });
  const [viewMode, setViewMode] = useState('editor');

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      
      <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
        <Button
          variant={viewMode === 'editor' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setViewMode('editor')}
        >
          Редактор
        </Button>
        <Button
          variant={viewMode === 'preview' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setViewMode('preview')}
        >
          Просмотр
        </Button>
      </Box>

      {viewMode === 'editor' ? (
        <TextareaAutosize
          minRows={15}
          style={{ 
            width: '100%', 
            fontFamily: 'monospace', 
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          value={field.value || ''}
          onChange={field.onChange}
          placeholder="Введите текст статьи в формате Markdown..."
        />
      ) : (
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '16px',
            minHeight: '300px',
            overflow: 'auto',
            backgroundColor: '#f9f9f9'
          }}
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
            {field.value || '(нет текста)'}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default MarkdownEditor;
