// admin-frontend/src/components/ArticleEdit/EditorContext.js
import React, { createContext, useContext, useState } from 'react';

const EditorContext = createContext();

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};

export const EditorProvider = ({ children }) => {
  const [editor, setEditor] = useState(null);

  return (
    <EditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </EditorContext.Provider>
  );
};