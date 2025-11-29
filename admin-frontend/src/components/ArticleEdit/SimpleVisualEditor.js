import React from 'react';
import { Box, Typography } from '@mui/material';
import { useInput } from 'react-admin';
import VisualToolbar from './VisualToolbar';
import useTiptapEditor from './useTiptapEditor';
import { EditorContent } from '@tiptap/react';

const SimpleVisualEditor = ({ source, label }) => {
  const { field } = useInput({ source });
  
  const { editor } = useTiptapEditor(
    field.value || '', 
    (html) => {
      // Сохраняем HTML при каждом изменении
      field.onChange(html);
    }
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      
      {/* Панель инструментов */}
      {editor && (
        <VisualToolbar editor={editor} />
      )}

      {/* Область редактирования */}
      <Box sx={{ 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        minHeight: '400px',
        overflow: 'hidden',
      }}>
        {editor && (
          <EditorContent 
            editor={editor} 
            style={{ 
              minHeight: '400px',
              padding: '16px',
              outline: 'none',
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default SimpleVisualEditor;