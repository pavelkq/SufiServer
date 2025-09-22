// admin-frontend/src/components/ArticleEdit/VisualToolbar.js
import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  ButtonGroup,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  Code,
  FormatQuote,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  FormatClear,
} from '@mui/icons-material';

const HEADING_OPTIONS = [
  { value: 'paragraph', label: 'Абзац' },
  { value: '1', label: 'Заголовок 1' },
  { value: '2', label: 'Заголовок 2' },
  { value: '3', label: 'Заголовок 3' },
  { value: '4', label: 'Заголовок 4' },
  { value: '5', label: 'Заголовок 5' },
  { value: '6', label: 'Заголовок 6' },
];

const VisualToolbar = ({ editor }) => {
  if (!editor) return null;

  const setHeading = (level) => {
    if (level === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: parseInt(level) }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Введите URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    if (editor.isActive('heading', { level: 4 })) return '4';
    if (editor.isActive('heading', { level: 5 })) return '5';
    if (editor.isActive('heading', { level: 6 })) return '6';
    return 'paragraph';
  };

  return (
    <Box sx={{ 
      borderBottom: '1px solid #ccc', 
      p: 1, 
      bgcolor: '#f5f5f5',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      alignItems: 'center'
    }}>
      {/* Выбор стиля */}
      <Select
        size="small"
        value={getCurrentHeading()}
        onChange={(e) => setHeading(e.target.value)}
        sx={{ 
          minWidth: 120, 
          height: 32,
          mr: 1,
          '& .MuiSelect-select': { py: 0.5 }
        }}
      >
        {HEADING_OPTIONS.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      <ButtonGroup size="small" sx={{ mr: 1 }}>
        {/* Основное форматирование */}
        <Tooltip title="Жирный">
          <IconButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive('bold') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatBold fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Курсив">
          <IconButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive('italic') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatItalic fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Подчеркнутый">
          <IconButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            color={editor.isActive('underline') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatUnderlined fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Зачеркнутый">
          <IconButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            color={editor.isActive('strike') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatStrikethrough fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup size="small" sx={{ mr: 1 }}>
        {/* Списки и цитаты */}
        <Tooltip title="Маркированный список">
          <IconButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Нумерованный список">
          <IconButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Цитата">
          <IconButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            color={editor.isActive('blockquote') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Код">
          <IconButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            color={editor.isActive('code') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <Code fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup size="small" sx={{ mr: 1 }}>
        {/* Ссылка */}
        <Tooltip title="Ссылка">
          <IconButton
            onClick={addLink}
            color={editor.isActive('link') ? 'primary' : 'default'}
            size="small"
            sx={{ width: 32, height: 32 }}
          >
            <Link fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      {/* Очистка форматирования */}
      <Tooltip title="Очистить форматирование">
        <IconButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          size="small"
          sx={{ width: 32, height: 32 }}
        >
          <FormatClear fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default VisualToolbar;