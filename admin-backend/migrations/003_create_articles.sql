CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(1000) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  group_id INTEGER NOT NULL,  -- без внешнего ключа на таблицу groups
  publish_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE articles ADD COLUMN markdown_text TEXT;
