// admin-frontend/src/components/ArticleEdit/useTiptapEditor.js
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import { useCallback, useEffect } from 'react';

// Кастомный CodeBlock который НЕ экранирует HTML
const CustomCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // Отключаем автоматическое экранирование HTML
      HTMLAttributes: {
        ...this.parent?.().HTMLAttributes,
        'data-raw-html': true,
      },
    };
  },
});

const useTiptapEditor = (initialContent, onUpdate) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block',
            'data-raw-html': 'true', // Флаг что это сырой HTML
          },
        },
      }),
      Underline,
      CustomCodeBlock.configure({
        HTMLAttributes: {
          class: 'code-block',
          'data-raw-html': 'true',
        },
      }),
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