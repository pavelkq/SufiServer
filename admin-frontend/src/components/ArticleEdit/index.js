import React, { useState, useEffect } from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateTimeInput,
  SelectInput,
  useRecordContext,
  useGetList,
  useRedirect,
  Loading,
} from 'react-admin';
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { Save, Cancel, Delete } from '@mui/icons-material';

import MarkdownEditor from './MarkdownEditor';
import FileUploadSection from './FileUploadSection';
import TagsSection from './TagsSection';
import useArticleSave from './useArticleSave';

const ArticleEdit = (props) => {
  const record = useRecordContext();
  const redirect = useRedirect();
  const { data: groups, isLoading: groupsLoading } = useGetList('groups');
  const { data: categories, isLoading: categoriesLoading } = useGetList('categories');
  const { data: tags, isLoading: tagsLoading } = useGetList('tags');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(true); // По умолчанию считаем что это создание

  // Определяем режим при изменении record
  useEffect(() => {
    console.log('=== USE EFFECT DEBUG ===');
    console.log('record changed:', record);
    console.log('record title:', record?.title);
    console.log('record id:', record?.id);
    
    if (record && record.title) {
      console.log('Setting isCreate to FALSE - editing mode');
      setIsCreate(false);
    } else {
      console.log('Setting isCreate to TRUE - creation mode');
      setIsCreate(true);
    }
  }, [record]);

  // Отладочная информация при каждом рендере
  console.log('=== RENDER DEBUG ===');
  console.log('record:', record);
  console.log('isCreate state:', isCreate);
  console.log('======================');

  const {
    selectedTags,
    loading,
    handleSave,
    handleDelete,
    handleTagToggle,
  } = useArticleSave(record, isCreate, redirect);

  const onDelete = async () => {
    await handleDelete();
    setDeleteDialogOpen(false);
  };

  const onCancel = () => {
    redirect('list', 'articles');
  };

  // Если это должно быть редактирование но данные еще не загрузились, показываем загрузку
  if (!isCreate && !record) {
    console.log('Showing loading - editing mode but no data yet');
    return <Loading />;
  }

  return (
    <Edit {...props} mutationMode="pessimistic">
      <SimpleForm
        toolbar={null}
        onSubmit={handleSave}
        defaultValues={isCreate ? {
          title: '',
          markdown_text: '',
          category_id: '',
          group_id: 5,
          publish_date: null,
        } : {
          title: record?.title || '',
          markdown_text: record?.markdown_text || '',
          category_id: record?.category_id || '',
          group_id: record?.group_id || 5,
          publish_date: record?.publish_date || null,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextInput 
              source="title" 
              label="Название" 
              fullWidth 
              disabled={loading}
            />
            <MarkdownEditor 
              source="markdown_text" 
              label="Текст статьи" 
            />
            <FileUploadSection />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <SelectInput
                source="category_id"
                label="Категория"
                choices={categories?.map(c => ({ id: c.id, name: c.name })) || []}
                fullWidth
                disabled={loading}
              />

              <TagsSection 
                tags={tags} 
                selectedTags={selectedTags} 
                onTagToggle={handleTagToggle} 
                loading={loading} 
              />

              <SelectInput
                source="group_id"
                label="Группа доступа"
                choices={groups?.map(g => ({ id: g.id, name: g.name })) || []}
                fullWidth
                sx={{ mt: 2 }}
                disabled={loading}
              />

              <DateTimeInput
                source="publish_date"
                label="Дата публикации"
                fullWidth
                sx={{ mt: 2 }}
                options={{
                  format: 'dd.MM.yyyy HH:mm',
                  ampm: false,
                }}
                disabled={loading}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {/* Основная кнопка действия */}
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<Save />}
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : (isCreate ? 'Создать' : 'Сохранить')}
                </Button>
                
                {/* Кнопка отмены */}
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  startIcon={<Cancel />}
                  fullWidth
                  disabled={loading}
                >
                  Отмена
                </Button>

                {/* Кнопка удаления - ТОЛЬКО в режиме редактирования */}
                {!isCreate && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                    startIcon={<Delete />}
                    fullWidth
                    disabled={loading}
                  >
                    Удалить
                  </Button>
                )}

                {/* Debug info */}
                <Box sx={{ 
                  p: 1, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 1,
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  DEBUG: isCreate={isCreate.toString()}, hasRecord={!!record}, recordTitle={record?.title || 'null'}
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Диалог подтверждения удаления - ТОЛЬКО в режиме редактирования */}
        {!isCreate && (
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogContent>
              <Typography>Вы уверены, что хотите удалить эту статью?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
                Отмена
              </Button>
              <Button onClick={onDelete} color="error" variant="contained" disabled={loading}>
                Удалить
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </SimpleForm>
    </Edit>
  );
};

export default ArticleEdit;
