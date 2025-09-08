import React from 'react';
import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import ResetPassword from './pages/ResetPassword';
import dataProvider from './dataProvider';
import authProvider from './authProvider';
// Импортируем i18nProvider, расширенный вашими переводами
import i18nProvider from './i18nProvider'; 

// Компоненты пользователей
import { UserList } from './components/UserList';
import { UserEdit } from './components/UserEdit';
// Компоненты статей - разделяем создание и редактирование
import ArticleList from './components/ArticleList';
import ArticleEdit from './components/ArticleEdit';
import ArticleCreate from './components/ArticleCreate';
// Компоненты категорий
import { CategoryList } from './components/CategoryList';
import { CategoryEdit } from './components/CategoryEdit';
import { CategoryCreate } from './components/CategoryCreate';

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    i18nProvider={i18nProvider} // используем кастомный i18nProvider с вашими переводами
    locale="ru"
  >
    <Resource name="users" list={UserList} edit={UserEdit} />
    <Resource 
      name="articles" 
      list={ArticleList} 
      edit={ArticleEdit} 
      create={ArticleCreate} 
    />
    <CustomRoutes noLayout>
      <Route path="/reset-password" element={<ResetPassword />} />
    </CustomRoutes>
  </Admin>
);

export default App;
