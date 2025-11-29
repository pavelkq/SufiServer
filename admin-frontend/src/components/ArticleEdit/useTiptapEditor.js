import { useEditor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Paragraph from '@tiptap/extension-paragraph';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useEffect } from 'react';

// Кастомное расширение для изображений с поддержкой выравнивания
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style
          };
        },
      },
      class: {
        default: 'tiptap-image',
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          return {
            class: attributes.class
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },
});

const useTiptapEditor = (initialContent, onUpdate) => {
  const editor = useEditor({
    extensions: [
      Document,
      Text,
      Paragraph,
      Dropcursor,
      Gapcursor,
      
      StarterKit.configure({
        document: false,
        text: false,  
        paragraph: false,
        dropcursor: false,
        gapcursor: false,
        underline: false,
        link: false,
      }),
      Underline,
      CustomImage.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
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