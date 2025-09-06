import React from 'react';
import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import ResetPassword from './pages/ResetPassword';
import dataProvider from './dataProvider';
import authProvider from './authProvider';

// Импортируем русский перевод
import polyglotI18nProvider from 'ra-i18n-polyglot';
import russianMessages from 'ra-language-russian';

// Компоненты пользователей
import { UserList } from './components/UserList';
import { UserEdit } from './components/UserEdit';

// Компоненты статей - используем только ArticleEdit для создания и редактирования
import ArticleList from './components/ArticleList';
import ArticleEdit from './components/ArticleEdit';

// Компоненты категорий
import { CategoryList } from './components/CategoryList';
import { CategoryEdit } from './components/CategoryEdit';
import { CategoryCreate } from './components/CategoryCreate';

const i18nProvider = polyglotI18nProvider(() => russianMessages, 'ru');

const App = () => (
  <Admin
    dataProvider={dataProvider}
    authProvider={authProvider}
    i18nProvider={i18nProvider}
    locale="ru"
  >
    <Resource name="users" list={UserList} edit={UserEdit} />
    <Resource 
      name="articles" 
      list={ArticleList} 
      edit={ArticleEdit}
      create={ArticleEdit} // Используем тот же компонент для создания
    />
    <CustomRoutes noLayout>
      <Route path="/reset-password" element={<ResetPassword />} />
    </CustomRoutes>
  </Admin>
);

export default App;
