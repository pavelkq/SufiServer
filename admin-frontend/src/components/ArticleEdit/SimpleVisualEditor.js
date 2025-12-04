import React, { useEffect } from 'react';
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
      field.onChange(html);
    }
  );

  useEffect(() => {
    console.log('=== DEBUG: Editor initialization ===');
    console.log('Editor instance:', editor);
    
    if (editor) {
      window.currentEditor = editor;
      console.log('✅ Editor saved to window.currentEditor');
      console.log('Editor state:', editor.state);
      console.log('Editor is active:', editor.isActive);
    } else {
      console.log('❌ Editor is null or undefined');
    }
    
    return () => {
      if (window.currentEditor === editor) {
        window.currentEditor = null;
        console.log('🔄 Editor cleared from window.currentEditor');
      }
    };
  }, [editor]);

  return (
    <Box sx={{ mb: 4 }}>
      <style>{`
        .ProseMirror table {
          border-collapse: collapse !important;
          margin: 16px 0 !important;
          width: 100% !important;
        }
        
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px dashed #666 !important;
          padding: 8px 12px !important;
          min-width: 80px !important;
        }
        
        .ProseMirror table th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
        }
      `}</style>
      
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      
      {editor && (
        <VisualToolbar editor={editor} />
      )}

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
