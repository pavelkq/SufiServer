CREATE TABLE article_versions (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  markdown_text TEXT NOT NULL,
  html_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

