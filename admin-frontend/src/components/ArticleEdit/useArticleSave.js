import { useState, useEffect } from 'react';
import { useDataProvider, useNotify, useRefresh } from 'react-admin';

const useArticleSave = (record, isCreate, redirect) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isCreate && record?.id) {
      const fetchArticleTags = async () => {
        try {
          const { data } = await dataProvider.getArticleTags(record.id);
          setSelectedTags(data.map(tag => tag.id));
        } catch (error) {
          console.error('Ошибка загрузки тегов статьи:', error);
        }
      };
      fetchArticleTags();
    } else {
      setSelectedTags([]);
    }
  }, [record?.id, isCreate, dataProvider]);

  const handleTagToggle = (tagId) =>
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );

  const handleSave = async (data) => {
    setLoading(true);
    try {
      let articleId;
      if (isCreate) {
        const { data: newArticle } = await dataProvider.create('articles', { data });
        articleId = newArticle.id;
        notify('resources.articles.notifications.created', { type: 'info' });
      } else {
        const { data: updatedArticle } = await dataProvider.update('articles', {
          id: record.id,
          data,
        });
        articleId = updatedArticle.id;
        notify('resources.articles.notifications.updated', { type: 'info' });
      }

      // Обновляем связи тегов
      const currentTags = await dataProvider.getArticleTags(articleId);

      // Удаляем удалённые теги
      const tagsToDelete = currentTags.data.filter(t => !selectedTags.includes(t.id));
      await Promise.all(tagsToDelete.map(tag =>
        dataProvider.deleteArticleTag({ article_id: articleId, tag_id: tag.id })
      ));

      // Добавляем новые теги
      const tagsToAdd = selectedTags.filter(id => !currentTags.data.some(t => t.id === id));
      await Promise.all(tagsToAdd.map(tagId =>
        dataProvider.createArticleTag({ article_id: articleId, tag_id: tagId })
      ));

      redirect('list', 'articles');
      refresh();  // Обязательно обновляем список после редиректа
    } catch (error) {
      console.error('Ошибка при сохранении статьи:', error);
      notify('resources.articles.notifications.error', { type: 'warning' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await dataProvider.delete('articles', { id: record.id });
      notify('resources.articles.notifications.deleted', { type: 'info' });
      redirect('list', 'articles');
      refresh();  // Обновление списка после удаления
    } catch (error) {
      console.error('Ошибка при удалении статьи:', error);
      notify('resources.articles.notifications.error', { type: 'warning' });
      setLoading(false);
    }
  };

  return {
    selectedTags,
    loading,
    handleSave,
    handleDelete,
    handleTagToggle,
  };
};

export default useArticleSave;
