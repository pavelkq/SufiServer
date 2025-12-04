import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  ButtonGroup,
  Divider,
} from '@mui/material';
import {
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  CodeOff,
  Link as LinkIcon,
  FormatClear,
  TableChart,
  Delete,
  MergeType,
  ViewColumn,
} from '@mui/icons-material';

// Опции заголовков
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
      editor
        .chain()
        .focus()
        .toggleHeading({ level: parseInt(level, 10) })
        .run();
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
    <Box
      sx={{
        borderBottom: '1px solid #ccc',
        p: 1,
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'center',
      }}
    >
      {/* Выпадающий список заголовков */}
      <Select
        size="small"
        value={getCurrentHeading()}
        onChange={(e) => setHeading(e.target.value)}
        sx={{
          minWidth: 120,
          height: 32,
          mr: 1,
          '& .MuiSelect-select': { py: 0.5 },
        }}
      >
        {HEADING_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>

      {/* Списки, цитата, ссылка */}
      <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'white' }}>
        <Tooltip title="Маркированный список">
          <IconButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
            size="small"
          >
            <FormatListBulleted fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Нумерованный список">
          <IconButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
            size="small"
          >
            <FormatListNumbered fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Цитата">
          <IconButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            color={editor.isActive('blockquote') ? 'primary' : 'default'}
            size="small"
          >
            <FormatQuote fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Ссылка">
          <IconButton
            onClick={addLink}
            color={editor.isActive('link') ? 'primary' : 'default'}
            size="small"
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Таблицы */}
      <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'white' }}>
        <Tooltip title="Вставить таблицу 3x3">
          <IconButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            size="small"
          >
            <TableChart fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Добавить колонку">
          <span>
            <IconButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.can().addColumnAfter()}
              size="small"
            >
              <ViewColumn fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Добавить строку">
          <span>
            <IconButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.can().addRowAfter()}
              size="small"
            >
              <TableChart fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Объединить ячейки">
          <span>
            <IconButton
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
              size="small"
            >
              <MergeType fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Удалить таблицу">
          <span>
            <IconButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.can().deleteTable()}
              size="small"
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </ButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* Код и очистка */}
      <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'white' }}>
        <Tooltip title="Встроенный код">
          <IconButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            color={editor.isActive('code') ? 'primary' : 'default'}
            size="small"
          >
            <Code fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Блок кода">
          <IconButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            color={editor.isActive('codeBlock') ? 'primary' : 'default'}
            size="small"
          >
            <CodeOff fontSize="small" />
          </IconButton>
        </Tooltip>
      </ButtonGroup>

      <Tooltip title="Очистить форматирование">
        <IconButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          size="small"
          sx={{ ml: 1 }}
        >
          <FormatClear fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default VisualToolbar;
