import React from 'react';
import {
  Create,
  SimpleForm,
  TextInput,
  DateTimeInput,
  SelectInput,
  useGetList,
  useRedirect,
  Loading,
} from 'react-admin';
import { Box, Grid, Button } from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';

import SimpleVisualEditor from './ArticleEdit/SimpleVisualEditor';
import FileUploadSection from './ArticleEdit/FileUploadSection';
import TagsSection from './ArticleEdit/TagsSection';
import useArticleSave from './ArticleEdit/useArticleSave';

const ArticleCreate = (props) => {
  const redirect = useRedirect();
  const { data: groups, isLoading: groupsLoading } = useGetList('groups');
  const { data: categories, isLoading: categoriesLoading } = useGetList('categories');
  const { data: tags, isLoading: tagsLoading } = useGetList('tags');

  const { 
    selectedTags, 
    loading, 
    handleSave, 
    handleTagToggle 
  } = useArticleSave(null, true, redirect); // isCreate=true, no record

  // Если данные для селектов загружаются, показываем Loading
  if (groupsLoading || categoriesLoading || tagsLoading) {
    return <Loading />;
  }

  const onCancel = () => {
    redirect('list', 'articles');
  };

  return (
    <Create {...props} mutationMode="pessimistic">
      <SimpleForm
        toolbar={null}
        onSubmit={handleSave}
        defaultValues={{
          title: '',
          markdown_text: '',
          category_id: '',
          group_id: 5,
          publish_date: null,
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
            <SimpleVisualEditor 
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
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<Save />}
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Создать'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  startIcon={<Cancel />}
                  fullWidth
                  disabled={loading}
                >
                  Отмена
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </SimpleForm>
    </Create>
  );
};

export default ArticleCreate;