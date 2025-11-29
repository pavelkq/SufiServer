import React, { useState, useEffect } from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateTimeInput,
  SelectInput,
  useEditController,
  useRedirect,
  useGetList,
  Loading,
  Error,
} from 'react-admin';
import { Box, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';
import { Save, Cancel, Delete } from '@mui/icons-material';

import SimpleVisualEditor from './SimpleVisualEditor';
import FileUploadSection from './FileUploadSection';
import TagsSection from './TagsSection';
import useArticleSave from './useArticleSave';

const ArticleEdit = (props) => {
  const { record, isLoading, error } = useEditController(props);
  const redirect = useRedirect();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Загружаем справочные данные
  const { data: groups, isLoading: groupsLoading } = useGetList('groups');
  const { data: categories, isLoading: categoriesLoading } = useGetList('categories');
  const { data: tags, isLoading: tagsLoading } = useGetList('tags'); // Добавляем загрузку тем

  // Вызываем useArticleSave безусловно
  const { selectedTags, loading, handleSave, handleDelete, handleTagToggle } = useArticleSave(record, false, redirect);

  // Показываем загрузку если грузятся любые данные
  if (isLoading || groupsLoading || categoriesLoading || tagsLoading) {
    return <Loading />;
  }

  if (error) return <Error error={error} />;

  if (!record) return <Typography color="error">Статья не найдена.</Typography>;

  const onDelete = async () => {
    await handleDelete();
    setDeleteDialogOpen(false);
  };

  const onCancel = () => {
    redirect('list', 'articles');
  };

  return (
    <Edit {...props} mutationMode="pessimistic">
      <SimpleForm
        toolbar={null}
        onSubmit={handleSave}
        record={record}
        defaultValues={{
          title: record.title || '',
          markdown_text: record.markdown_text || '',
          category_id: record.category_id || '',
          group_id: record.group_id || 5,
          publish_date: record.publish_date || null,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextInput source="title" label="Название" fullWidth disabled={loading} />
            <SimpleVisualEditor source="markdown_text" label="Текст статьи" />
            <FileUploadSection />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 16 }}>
              <SelectInput
                source="category_id"
                label="Категория"
                fullWidth
                choices={categories?.map(c => ({ id: c.id, name: c.name })) || []}
                disabled={loading}
              />

              <TagsSection
                tags={tags || []} // Теперь передаем загруженные темы
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                loading={loading}
              />

              <SelectInput
                source="group_id"
                label="Группа доступа"
                fullWidth
                sx={{ mt: 2 }}
                choices={groups?.map(g => ({ id: g.id, name: g.name })) || []}
                disabled={loading}
              />

              <DateTimeInput
                source="publish_date"
                label="Дата публикации"
                fullWidth
                sx={{ mt: 2 }}
                options={{ format: 'dd.MM.yyyy HH:mm', ampm: false }}
                disabled={loading}
              />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button variant="contained" color="primary" type="submit" startIcon={<Save />} fullWidth disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>

                <Button variant="outlined" onClick={onCancel} startIcon={<Cancel />} fullWidth disabled={loading}>
                  Отмена
                </Button>

                <Button variant="outlined" color="error" onClick={() => setDeleteDialogOpen(true)} startIcon={<Delete />} fullWidth disabled={loading}>
                  Удалить
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogContent>
            <Typography>Вы уверены, что хотите удалить эту статью?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Отмена</Button>
            <Button onClick={onDelete} color="error" variant="contained" disabled={loading}>Удалить</Button>
          </DialogActions>
        </Dialog>
      </SimpleForm>
    </Edit>
  );
};

export default ArticleEdit;