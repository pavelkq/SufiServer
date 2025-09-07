import React, { useEffect } from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Filter,
  TextInput,
  TopToolbar,
  CreateButton,
  DeleteButton,
  Loading,
  Error as RaError,
  useDataProvider,
  useListContext,
  useNotify,
  useRefresh,
} from 'react-admin';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Tabs,
  Tab,
  Box,
  Typography,
} from '@mui/material';
import { 
  lightBlue, 
  lightGreen, 
  orange, 
  pink, 
  yellow 
} from '@mui/material/colors';

import { useCategories } from './hooks/useCategories';
import { useTags } from './hooks/useTags';

// Цвета для групп
const GROUP_COLORS = {
  1: lightBlue[100],
  2: lightGreen[100],
  3: yellow[100],
  4: orange[100],
  5: pink[100],
};

// Кастомная ячейка для даты с стилизацией по статусу
const CustomDateField = ({ record, ...props }) => {
  const now = new Date();
  const publishDate = record?.publish_date ? new Date(record.publish_date) : null;
  
  let status = 'draft';
  if (publishDate) {
    status = publishDate > now ? 'scheduled' : 'published';
  }

  return (
    <Box
      sx={{
        color: status === 'published' ? 'success.main' : 
              status === 'scheduled' ? 'warning.main' : 'text.secondary',
        fontWeight: status === 'draft' ? 'bold' : 'normal',
      }}
    >
      {publishDate ? (
        <DateField source="publish_date" showTime record={record} {...props} />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Черновик
        </Typography>
      )}
    </Box>
  );
};

const ArticleFilter = (props) => (
  <Filter {...props}>
    <TextInput label="Поиск по названию" source="title" alwaysOn />
    <TextInput label="Поиск по содержимому" source="content" />
  </Filter>
);

// Компонент вкладок категорий
const CategoryTabs = ({ categories }) => {
  const { filterValues, setFilters } = useListContext();
  
  const selectedCategoryId = filterValues.category_id != null 
    ? String(filterValues.category_id) 
    : 'all';

  const handleChange = (event, newValue) => {
    if (newValue === 'all') {
      setFilters(
        { ...filterValues, category_id: undefined },
        { page: 1 },
        true
      );
    } else {
      setFilters(
        { ...filterValues, category_id: Number(newValue) },
        { page: 1 },
        true
      );
    }
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={selectedCategoryId}
        onChange={handleChange}
        aria-label="Категории статей"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Все" value="all" />
        {categories
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((cat) => (
            <Tab 
              key={cat.id} 
              label={cat.name} 
              value={String(cat.id)}
            />
          ))}
      </Tabs>
    </Box>
  );
};

const ArticleListActions = ({ onOpenCategories, onOpenTags }) => (
  <TopToolbar>
    <CreateButton />
    <Button variant="outlined" onClick={onOpenCategories} sx={{ ml: 2 }}>
      Категории
    </Button>
    <Button variant="outlined" onClick={onOpenTags} sx={{ ml: 2 }}>
      Темы
    </Button>
  </TopToolbar>
);

const TagsModal = ({ open, onClose, tagsText, setTagsText, onSave, loading, error }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Редактирование тем</DialogTitle>
    <DialogContent dividers>
      {loading && <Loading />}
      {error && <RaError error={error.toString()} />}
      {!loading && !error && (
        <>
          <TextareaAutosize
            aria-label="Темы"
            minRows={10}
            style={{ 
              width: '100%',
              fontFamily: 'monospace',
              padding: '8px',
            }}
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder={`Введите темы, по одной на строке\nПример:\nФилософия\nИстория\nНаука`}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Каждая тема должна быть на новой строке. Дубликаты не допускаются.
          </Typography>
        </>
      )}
    </DialogContent>
    <DialogActions>
      <Button variant="outlined" onClick={onClose} disabled={loading}>
        Отмена
      </Button>
      <Button 
        variant="contained" 
        onClick={onSave} 
        disabled={loading}
        color="primary"
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </DialogActions>
  </Dialog>
);

// Кастомный Datagrid с цветными строками
const ColoredDatagrid = ({ rowClick, ...props }) => {
  const { data, isLoading, error } = useListContext();
  
  if (isLoading) return <Loading />;
  if (error) return <RaError error={error} />;
  if (!data || data.length === 0) return <Typography variant="body1">Нет статей</Typography>;

  return (
    <Box sx={{ mt: 2 }}>
      {data.map(record => (
        <Box
          key={record.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: record.group_id ? GROUP_COLORS[record.group_id] : '#ffffff',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '8px',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              backgroundColor: record.group_id 
                ? `${GROUP_COLORS[record.group_id]}CC` 
                : '#f5f5f5',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
          onClick={() => rowClick && rowClick(record.id, record, 'edit')}
        >
          {/* Дата публикации */}
          <Box sx={{ flex: 1, minWidth: '150px' }}>
            <CustomDateField record={record} />
          </Box>
          
          {/* Название */}
          <Box sx={{ flex: 2, minWidth: '200px', padding: '0 16px' }}>
            <Typography variant="body1">{record.title}</Typography>
          </Box>
          
          {/* Кнопка удаления */}
          <Box sx={{ flex: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
            <DeleteButton
              record={record}
              mutationMode="pessimistic"
              confirmTitle="Подтверждение удаления"
              confirmContent="Вы уверены, что хотите удалить эту статью?"
              sx={{
                backgroundColor: '#ffffff',
                '&:hover': {
                  backgroundColor: '#ffebee',
                },
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const ArticleList = (props) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  const categoriesHook = useCategories();
  const tagsHook = useTags();

  useEffect(() => {
    (async () => {
      try {
        const [{ data: cats }, { data: tags }] = await Promise.all([
          dataProvider.getList('categories', {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'name', order: 'ASC' },
            filter: {},
          }),
          dataProvider.getList('tags', {
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'name', order: 'ASC' },
            filter: {},
          })
        ]);
        categoriesHook.setCategories(cats);
        tagsHook.setTags(tags);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    })();
  }, [dataProvider]);

  const handleOpenCategories = () => {
    categoriesHook.setCategoriesOpen(true);
    categoriesHook.loadCategoriesForModal();
  };

  const handleCloseCategories = () => {
    categoriesHook.setCategoriesOpen(false);
    categoriesHook.setCategoriesText('');
    categoriesHook.setErrorCats(null);
  };

  const handleOpenTags = () => {
    tagsHook.setTagsOpen(true);
    tagsHook.loadTagsForModal();
  };

  const handleCloseTags = () => {
    tagsHook.setTagsOpen(false);
    tagsHook.setTagsText('');
    tagsHook.setErrorTags(null);
  };

  const handleSaveCategories = async () => {
    if (categoriesHook.loadingCats) return;
    
    if (!window.confirm('Вы уверены, что хотите сохранить изменения?')) {
      return;
    }

    try {
      categoriesHook.setLoadingCats(true);
      categoriesHook.setErrorCats(null);

      const { data: currentCategories } = await dataProvider.getList('categories', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'name', order: 'ASC' },
        filter: {},
      });

      const updatedCategories = await categoriesHook.handleSaveCategories(
        categoriesHook.categoriesText,
        currentCategories
      );

      categoriesHook.setCategories(updatedCategories);
      notify('Категории успешно обновлены', { type: 'info' });
      handleCloseCategories();
      
    } catch (error) {
      console.error('Ошибка при сохранении категорий:', error);
      categoriesHook.setErrorCats(error.message || 'Ошибка при сохранении категорий');
      notify('Ошибка при обновлении категорий', { type: 'warning' });
    } finally {
      categoriesHook.setLoadingCats(false);
    }
  };

  const handleSaveTags = async () => {
    if (tagsHook.loadingTags) return;
    
    if (!window.confirm('Вы уверены, что хотите сохранить изменения?')) {
      return;
    }

    try {
      tagsHook.setLoadingTags(true);
      tagsHook.setErrorTags(null);

      const { data: currentTags } = await dataProvider.getList('tags', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'name', order: 'ASC' },
        filter: {},
      });

      const updatedTags = await tagsHook.handleSaveTags(
        tagsHook.tagsText,
        currentTags
      );

      tagsHook.setTags(updatedTags);
      notify('Темы успешно обновлены', { type: 'info' });
      handleCloseTags();
      
    } catch (error) {
      console.error('Ошибка при сохранении тем:', error);
      tagsHook.setErrorTags(error.message || 'Ошибка при сохранении тем');
      notify('Ошибка при обновлении тем', { type: 'warning' });
    } finally {
      tagsHook.setLoadingTags(false);
    }
  };

  return (
    <>
      <List
        {...props}
        filters={<ArticleFilter />}
        actions={
          <ArticleListActions 
            onOpenCategories={handleOpenCategories}
            onOpenTags={handleOpenTags}
          />
        }
        sort={{ field: 'publish_date', order: 'DESC' }}
        queryOptions={{
          staleTime: 5 * 60 * 1000,
          cacheTime: 10 * 60 * 1000,
        }}
      >
        <CategoryTabs categories={categoriesHook.categories} />
        <ColoredDatagrid rowClick="edit" />
      </List>

      <TagsModal
        open={tagsHook.tagsOpen}
        onClose={handleCloseTags}
        tagsText={tagsHook.tagsText}
        setTagsText={tagsHook.setTagsText}
        onSave={handleSaveTags}
        loading={tagsHook.loadingTags}
        error={tagsHook.errorTags}
      />

      <Dialog open={categoriesHook.categoriesOpen} onClose={handleCloseCategories} maxWidth="sm" fullWidth>
        <DialogTitle>Редактирование категорий ({categoriesHook.categories.length})</DialogTitle>
        <DialogContent dividers>
          {categoriesHook.loadingCats && <Loading />}
          {categoriesHook.errorCats && <RaError error={categoriesHook.errorCats.toString()} />}
          {!categoriesHook.loadingCats && !categoriesHook.errorCats && (
            <>
              <TextareaAutosize
                aria-label="Категории"
                minRows={10}
                style={{ 
                  width: '100%',
                  fontFamily: 'monospace',
                  padding: '8px',
                }}
                value={categoriesHook.categoriesText}
                onChange={(e) => categoriesHook.setCategoriesText(e.target.value)}
                placeholder={`Введите категории, по одной на строке\nПример:\nКниги\nМедиа\nСтатьи`}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Каждая категория должна быть на новой строке. Дубликаты не допускаются.
                Категории с привязанными статьями будут переименованы вместо удаления.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCloseCategories} disabled={categoriesHook.loadingCats}>
            Отмена
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCategories} 
            disabled={categoriesHook.loadingCats}
            color="primary"
          >
            {categoriesHook.loadingCats ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ArticleList;
