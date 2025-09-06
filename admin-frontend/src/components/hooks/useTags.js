// hooks/useTags.js
import { useState } from 'react';
import { useDataProvider, useNotify } from 'react-admin';

export const useTags = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [tags, setTags] = useState([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsText, setTagsText] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);
  const [errorTags, setErrorTags] = useState(null);

  const loadTagsForModal = async () => {
    setLoadingTags(true);
    setErrorTags(null);
    try {
      const { data } = await dataProvider.getList('tags', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'name', order: 'ASC' },
        filter: {},
      });
      setTagsText(data.map(t => t.name).join('\n'));
    } catch (error) {
      setErrorTags(error.message || 'Ошибка при загрузке тем');
      notify('Ошибка при загрузке тем', { type: 'error' });
    } finally {
      setLoadingTags(false);
    }
  };

  const handleSaveTags = async (tagsText, currentTags) => {
    const newTags = tagsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (newTags.length === 0) {
      throw new Error('Должна быть хотя бы одна тема');
    }

    const hasDuplicates = new Set(newTags).size !== newTags.length;
    if (hasDuplicates) {
      throw new Error('Обнаружены дубликаты тем');
    }

    // 1. Создаем карту существующих тегов для быстрого поиска
    const existingTagsMap = new Map(
      currentTags.map(tag => [tag.name, tag])
    );

    // 2. Определяем операции для каждого нового тега
    const operations = [];
    
    for (const newTag of newTags) {
      // Если тег уже существует - пропускаем
      if (existingTagsMap.has(newTag)) continue;
      
      // Находим старый тег с таким же индексом (если есть)
      const oldTag = currentTags[newTags.indexOf(newTag)];
      
      if (oldTag) {
        // Обновляем существующий тег
        operations.push(
          dataProvider.update('tags', {
            id: oldTag.id,
            data: { name: newTag },
            previousData: oldTag
          })
        );
      } else {
        // Создаем новый тег
        operations.push(
          dataProvider.create('tags', {
            data: { name: newTag }
          })
        );
      }
    }

    // 3. Удаляем теги, которых нет в новом списке (без проверки использования)
    for (const oldTag of currentTags) {
      if (!newTags.includes(oldTag.name)) {
        operations.push(
          dataProvider.delete('tags', { id: oldTag.id })
        );
      }
    }

    // 4. Выполняем все операции
    await Promise.all(operations);

    // 5. Возвращаем обновленный список тегов
    const { data: updatedTags } = await dataProvider.getList('tags', {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'name', order: 'ASC' },
      filter: {},
    });

    return updatedTags;
  };

  return {
    tags,
    setTags,
    tagsOpen,
    setTagsOpen,
    tagsText,
    setTagsText,
    loadingTags,
    setLoadingTags,
    errorTags,
    setErrorTags,
    loadTagsForModal,
    handleSaveTags
  };
};
