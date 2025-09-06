// hooks/useCategories.js
import { useState } from 'react';
import { useDataProvider, useNotify } from 'react-admin';

export const useCategories = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesText, setCategoriesText] = useState('');
  const [loadingCats, setLoadingCats] = useState(false);
  const [errorCats, setErrorCats] = useState(null);

  const loadCategoriesForModal = async () => {
    setLoadingCats(true);
    setErrorCats(null);
    try {
      const { data } = await dataProvider.getList('categories', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'name', order: 'ASC' },
        filter: {},
      });
      setCategoriesText(data.map(c => c.name).join('\n'));
    } catch (error) {
      setErrorCats(error.message || 'Ошибка при загрузке категорий');
      notify('Ошибка при загрузке категорий', { type: 'error' });
    } finally {
      setLoadingCats(false);
    }
  };

  const handleSaveCategories = async (categoriesText, currentCategories) => {
    const newCategories = categoriesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (newCategories.length === 0) {
      throw new Error('Должна быть хотя бы одна категория');
    }

    const hasDuplicates = new Set(newCategories).size !== newCategories.length;
    if (hasDuplicates) {
      throw new Error('Обнаружены дубликаты категорий');
    }

    console.log('Новые категории:', newCategories);
    console.log('Текущие категории:', currentCategories.map(c => c.name));

    // 1. Создаем карты для быстрого поиска
    const existingCategoriesMap = new Map(
      currentCategories.map(cat => [cat.name, cat])
    );
    const currentCategoriesById = new Map(
      currentCategories.map(cat => [cat.id, cat])
    );

    // 2. Операции для выполнения
    const operations = [];

    // 3. Обрабатываем переименование и создание категорий
    for (let i = 0; i < newCategories.length; i++) {
      const newCategoryName = newCategories[i];
      
      // Если категория уже существует с таким именем - пропускаем
      if (existingCategoriesMap.has(newCategoryName)) continue;

      // Пытаемся найти существующую категорию по позиции для переименования
      const currentCategory = currentCategories[i];
      
      if (currentCategory && !existingCategoriesMap.has(newCategoryName)) {
        // Переименовываем существующую категорию
        operations.push(() =>
          dataProvider.update('categories', {
            id: currentCategory.id,
            data: { name: newCategoryName },
            previousData: currentCategory
          })
        );
        console.log(`Категория "${currentCategory.name}" будет переименована в "${newCategoryName}"`);
      } else {
        // Создаем новую категорию
        operations.push(() =>
          dataProvider.create('categories', {
            data: { name: newCategoryName }
          })
        );
        console.log(`Создана новая категория "${newCategoryName}"`);
      }
    }

    // 4. Выполняем операции создания/переименования
    for (const operation of operations) {
      await operation();
    }

    // 5. Теперь проверяем категории для удаления
    const deleteOperations = [];
    const categoriesToKeep = new Set(newCategories);

    for (const oldCategory of currentCategories) {
      // Если старой категории нет в новом списке
      if (!categoriesToKeep.has(oldCategory.name)) {
        try {
          console.log(`Проверяем категорию "${oldCategory.name}" (ID: ${oldCategory.id})`);
          
          // Проверяем, есть ли статьи в категории
          const result = await dataProvider.getList('articles', {
            pagination: { page: 1, perPage: 1 },
            filter: { category_id: oldCategory.id },
          }).catch(error => {
            console.error(`Ошибка при запросе статей для категории "${oldCategory.name}":`, error);
            throw error;
          });
          
          // Правильно получаем количество статей
          const total = result.total !== undefined ? result.total : (result.data?.length || 0);
          
          console.log(`Категория "${oldCategory.name}": статей = ${total}`, result);
          
          if (total === 0) {
            // Категория пустая - можно удалять
            deleteOperations.push(() =>
              dataProvider.delete('categories', { 
                id: oldCategory.id,
                previousData: oldCategory
              })
            );
            console.log(`Категория "${oldCategory.name}" будет удалена`);
          } else {
            // Категория не пустая - показываем предупреждение
            notify(`Категория "${oldCategory.name}" не удалена - содержит статьи`, { 
              type: 'warning',
              autoHideDuration: 5000
            });
            console.log(`Категория "${oldCategory.name}" НЕ будет удалена (есть статьи)`);
          }
        } catch (error) {
          console.error(`Ошибка при проверке категории "${oldCategory.name}":`, error);
          console.error('Детали ошибки:', error.response || error.message);
          
          // Показываем ошибку пользователю
          notify(`Ошибка при проверке категории "${oldCategory.name}": ${error.message}`, { 
            type: 'error',
            autoHideDuration: 10000
          });
          
          // Не удаляем категорию при ошибке
          console.log(`Категория "${oldCategory.name}" НЕ будет удалена из-за ошибки проверки`);
        }
      }
    }

    // 6. Выполняем операции удаления
    console.log('Категории для удаления:', deleteOperations.length);
    for (const deleteOperation of deleteOperations) {
      try {
        await deleteOperation();
        console.log('Категория успешно удалена');
      } catch (error) {
        console.error('Ошибка при удалении категории:', error);
        notify('Ошибка при удалении категории', { type: 'error' });
      }
    }

    // 7. Возвращаем обновленный список категорий
    const { data: updatedCategories } = await dataProvider.getList('categories', {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'name', order: 'ASC' },
      filter: {},
    });

    console.log('Финальный список категорий:', updatedCategories.map(c => c.name));
    return updatedCategories;
  };

  return {
    categories,
    setCategories,
    categoriesOpen,
    setCategoriesOpen,
    categoriesText,
    setCategoriesText,
    loadingCats,
    setLoadingCats,
    errorCats,
    setErrorCats,
    loadCategoriesForModal,
    handleSaveCategories
  };
};
