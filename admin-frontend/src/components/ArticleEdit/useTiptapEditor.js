// admin-frontend/src/components/ArticleEdit/useTiptapEditor.js
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { useCallback } from 'react';

const useTiptapEditor = (initialContent, onUpdate) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'custom-link',
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap',
        style: 'outline: none; min-height: 300px; padding: 16px;',
      },
    },
  });

  const setContent = useCallback((content) => {
    if (editor) {
      editor.commands.setContent(content);
    }
  }, [editor]);

  return { editor, setContent };
};

export default useTiptapEditor;