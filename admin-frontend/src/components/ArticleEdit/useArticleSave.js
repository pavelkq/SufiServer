import { useState, useEffect } from 'react';
import { useDataProvider, useNotify } from 'react-admin';

const useArticleSave = (record, isCreate, redirect) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  
  const [selectedTags, setSelectedTags] = useState([]);
  const [articleTagsData, setArticleTagsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загружаем теги статьи (только для редактирования)
  useEffect(() => {
    if (!isCreate && record?.id) {
      console.log('Загрузка тегов для статьи ID:', record.id);
      dataProvider.getList('article_tags', {
        filter: { article_id: record.id },
        pagination: { page: 1, perPage: 100 },
        sort: { field: 'id', order: 'ASC' }
      })
      .then(({ data }) => {
        console.log('Загружены теги статьи:', data);
        setArticleTagsData(data);
        setSelectedTags(data.map(at => at.tag_id));
      })
      .catch(error => {
        console.error('Ошибка загрузки тегов статьи:', error);
      });
    }
  }, [isCreate, record?.id, dataProvider]);

  const handleSave = async (formData) => {
    setLoading(true);
    console.log('Данные формы:', formData);
    console.log('Выбранные теги:', selectedTags);
    console.log('Режим:', isCreate ? 'create' : 'edit');

    try {
      if (isCreate) {
        // СОЗДАНИЕ НОВОЙ СТАТЬИ
        console.log('Создание новой статьи');
        
        const articleData = {
          title: formData.title,
          markdown_text: formData.markdown_text || '',
          category_id: parseInt(formData.category_id),
          group_id: parseInt(formData.group_id) || 5,
          publish_date: formData.publish_date,
        };

        console.log('Данные для создания статьи:', articleData);

        // 1. Создаем статью
        const { data: newArticle } = await dataProvider.create('articles', {
          data: articleData
        });

        console.log('Статья создана:', newArticle);

        // 2. Добавляем теги (если есть выбранные)
        if (selectedTags.length > 0) {
          console.log('Добавляем теги:', selectedTags);
          await Promise.all(
            selectedTags.map(tagId =>
              dataProvider.create('article_tags', {
                data: {
                  article_id: newArticle.id,
                  tag_id: tagId,
                },
              })
            )
          );
        }

        notify('Статья успешно создана', { type: 'success' });
        redirect('list', 'articles');
        
      } else {
        // РЕДАКТИРОВАНИЕ СУЩЕСТВУЮЩЕЙ СТАТЬИ
        console.log('Обновление статьи ID:', record.id);
        
        const articleData = {
          title: formData.title,
          markdown_text: formData.markdown_text || '',
          category_id: parseInt(formData.category_id),
          group_id: parseInt(formData.group_id),
          publish_date: formData.publish_date,
        };

        console.log('Данные для обновления статьи:', articleData);

        // 1. Сохраняем статью
        await dataProvider.update('articles', {
          id: record.id,
          data: articleData,
          previousData: record,
        });

        console.log('Статья обновлена');

        // 2. Обновляем теги
        const currentTags = selectedTags;
        const previousTags = articleTagsData.map(at => at.tag_id);

        console.log('Текущие теги:', currentTags);
        console.log('Предыдущие теги:', previousTags);

        // Добавляем новые связи
        const tagsToAdd = currentTags.filter(tagId => !previousTags.includes(tagId));
        if (tagsToAdd.length > 0) {
          console.log('Добавляем теги:', tagsToAdd);
          await Promise.all(
            tagsToAdd.map(tagId =>
              dataProvider.create('article_tags', {
                data: {
                  article_id: record.id,
                  tag_id: tagId,
                },
              })
            )
          );
        }

        // Удаляем старые связи
        const tagsToRemove = previousTags.filter(tagId => !currentTags.includes(tagId));
        if (tagsToRemove.length > 0) {
          console.log('Удаляем теги:', tagsToRemove);
          await Promise.all(
            tagsToRemove.map(tagId => {
              const articleTag = articleTagsData.find(at => at.tag_id === tagId);
              if (articleTag) {
                return dataProvider.delete('article_tags', {
                  id: articleTag.id,
                  previousData: articleTag,
                });
              }
              return Promise.resolve();
            })
          );
        }

        notify('Статья успешно сохранена', { type: 'success' });
        redirect('list', 'articles');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      console.error('Детали ошибки:', error.response || error.message);
      notify('Ошибка при сохранении статьи: ' + (error.message || 'неизвестная ошибка'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dataProvider.delete('articles', {
        id: record.id,
        previousData: record,
      });
      notify('Статья удалена', { type: 'success' });
      redirect('list', 'articles');
    } catch (error) {
      notify('Ошибка при удалении статьи', { type: 'error' });
    }
  };

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
