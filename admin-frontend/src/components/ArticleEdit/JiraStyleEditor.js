// admin-frontend/src/components/ArticleEdit/JiraStyleEditor.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, TextareaAutosize } from '@mui/material';
import { useInput } from 'react-admin';
import { Visibility, Code } from '@mui/icons-material';
import VisualToolbar from './VisualToolbar';
import useTiptapEditor from './useTiptapEditor';
import { EditorContent } from '@tiptap/react';

const JiraStyleEditor = ({ source, label }) => {
  const { field } = useInput({ source });
  const [viewMode, setViewMode] = useState('visual');
  const [textValue, setTextValue] = useState(field.value || '');
  const lastContentRef = useRef(field.value || '');
  
  const { editor, setContent } = useTiptapEditor(
    field.value || '', 
    (html) => {
      // Сохраняем только если контент действительно изменился
      if (html !== lastContentRef.current) {
        lastContentRef.current = html;
        field.onChange(html);
      }
    }
  );

  // Синхронизация только при внешних изменениях
  useEffect(() => {
    if (field.value !== lastContentRef.current) {
      lastContentRef.current = field.value || '';
      setTextValue(field.value || '');
      
      if (editor && viewMode === 'visual') {
        // Сохраняем позицию курсора перед обновлением
        const previousSelection = editor.state.selection;
        setContent(field.value || '');
        // Восстанавливаем позицию курсора
        editor.commands.setTextSelection(previousSelection);
      }
    }
  }, [field.value, editor, viewMode, setContent]);

  const handleModeChange = (newMode) => {
    if (newMode === 'text' && viewMode === 'visual') {
      // При переключении в текстовый режим
      const jiraText = htmlToJira(field.value || '');
      setTextValue(jiraText);
      lastContentRef.current = jiraText;
      field.onChange(jiraText);
    } else if (newMode === 'visual' && viewMode === 'text') {
      // При переключении в визуальный режим
      const html = jiraToHtml(textValue);
      lastContentRef.current = html;
      field.onChange(html);
      if (editor) {
        setContent(html);
      }
    }
    setViewMode(newMode);
  };

  const handleTextChange = (event) => {
    const newValue = event.target.value;
    setTextValue(newValue);
    lastContentRef.current = newValue;
    field.onChange(newValue);
  };

  // Заглушки функций конвертации
  const htmlToJira = (html) => {
    return html;
  };

  const jiraToHtml = (jiraText) => {
    return jiraText;
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'visual' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Visibility />}
            onClick={() => handleModeChange('visual')}
          >
            Визуальный
          </Button>
          <Button
            variant={viewMode === 'text' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Code />}
            onClick={() => handleModeChange('text')}
          >
            Текст
          </Button>
        </Box>
        
        {viewMode === 'visual' && (
          <Typography variant="caption" color="text.secondary">
            Справка по визуальному режиму
          </Typography>
        )}
        {viewMode === 'text' && (
          <Typography variant="caption" color="text.secondary">
            Справка по текстовому режиму
          </Typography>
        )}
      </Box>

      {/* Панель инструментов для визуального режима */}
      {viewMode === 'visual' && editor && (
        <VisualToolbar editor={editor} />
      )}

      {viewMode === 'visual' ? (
        <Box sx={{ 
          border: '1px solid #ccc', 
          borderRadius: '4px', 
          minHeight: '300px',
          overflow: 'hidden',
        }}>
          {editor && (
            <EditorContent 
              editor={editor} 
              style={{ 
                minHeight: '300px',
                padding: '16px',
                outline: 'none',
              }}
            />
          )}
        </Box>
      ) : (
        <TextareaAutosize
          minRows={15}
          style={{ 
            width: '100%', 
            fontFamily: 'monospace', 
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          value={textValue}
          onChange={handleTextChange}
          placeholder="Введите текст статьи в формате Jira Wiki..."
        />
      )}
    </Box>
  );
};

export default JiraStyleEditor;