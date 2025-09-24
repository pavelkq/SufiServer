// admin-frontend/src/components/ArticleEdit/JiraStyleEditor.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, TextareaAutosize } from '@mui/material';
import { useInput } from 'react-admin';
import { Visibility, Code } from '@mui/icons-material';
import VisualToolbar from './VisualToolbar';
import useTiptapEditor from './useTiptapEditor';
import { EditorContent } from '@tiptap/react';
import { htmlToJira, jiraToHtml } from './jiraConverter';

const JiraStyleEditor = ({ source, label }) => {
  const { field } = useInput({ source });
  const [viewMode, setViewMode] = useState('visual');
  const [jiraText, setJiraText] = useState('');
  const lastContentRef = useRef(field.value || '');
  
  // Используем полноценный TipTap редактор с HTML
  const { editor, setContent } = useTiptapEditor(
    field.value || '', 
    (html) => {
      console.log('TipTap generated HTML:', html); // ДОБАВИЛИ ОТЛАДКУ
      if (html !== lastContentRef.current) {
        lastContentRef.current = html;
        field.onChange(html);
      }
    }
  );

  // Синхронизация при внешних изменениях
  useEffect(() => {
    if (field.value !== lastContentRef.current) {
      lastContentRef.current = field.value || '';
      
      if (viewMode === 'visual' && editor) {
        const previousSelection = editor.state.selection;
        setContent(field.value || '');
        editor.commands.setTextSelection(previousSelection);
      }
    }
  }, [field.value, editor, viewMode, setContent]);

  const handleModeChange = (newMode) => {
    console.log('Switching mode from', viewMode, 'to', newMode); // ДОБАВИЛИ ОТЛАДКУ
    console.log('Current HTML content:', field.value); // ДОБАВИЛИ ОТЛАДКУ
    
    if (newMode === 'text' && viewMode === 'visual') {
      // Конвертируем HTML -> Jira Wiki
      const jiraText = htmlToJira(field.value || '');
      console.log('Converted Jira text:', jiraText); // ДОБАВИЛИ ОТЛАДКУ
      setJiraText(jiraText);
    } else if (newMode === 'visual' && viewMode === 'text') {
      // Конвертируем Jira Wiki -> HTML
      const html = jiraToHtml(jiraText);
      console.log('Converted HTML from Jira:', html); // ДОБАВИЛИ ОТЛАДКУ
      if (editor) {
        setContent(html);
      }
      if (html !== field.value) {
        field.onChange(html);
      }
    }
    setViewMode(newMode);
  };

  const handleTextChange = (event) => {
    const newValue = event.target.value;
    setJiraText(newValue);
    if (viewMode === 'text') {
      const html = jiraToHtml(newValue);
      field.onChange(html);
    }
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
            Текст (Jira Wiki)
          </Button>
        </Box>
        
        {viewMode === 'visual' && (
          <Typography variant="caption" color="text.secondary">
            Визуальный редактор с форматированием
          </Typography>
        )}
        {viewMode === 'text' && (
          <Typography variant="caption" color="text.secondary">
            Редактирование в формате Jira Wiki
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
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
          }}
          value={jiraText}
          onChange={handleTextChange}
          placeholder={`Введите текст статьи в формате Jira Wiki...

Примеры форматирования:
*жирный текст*
_курсив_
+подчёркнутый+
-зачёркнутый-
{{код}}
{code}блок кода{code}

h1. Заголовок 1
* пункт списка
# нумерованный пункт
{quote}цитата{quote}
[ссылка|https://example.com]`}
        />
      )}
    </Box>
  );
};

export default JiraStyleEditor;