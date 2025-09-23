// admin-frontend/src/components/ArticleEdit/useTiptapEditor.js
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useCallback, useEffect } from 'react';

const useTiptapEditor = (initialContent, onUpdate) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
  });

  const setContent = useCallback((content) => {
    if (editor) {
      editor.commands.setContent(content);
    }
  }, [editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  return { editor, setContent };
};

export default useTiptapEditor;