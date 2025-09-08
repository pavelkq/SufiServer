import polyglotI18nProvider from 'ra-i18n-polyglot';
import russianMessages from 'ra-language-russian';

const customRussianMessages = {
  ...russianMessages,
  resources: {
    ...russianMessages.resources,
    articles: {
      ...russianMessages.resources?.articles,
      notifications: {
        updated: 'Статья успешно обновлена',
        created: 'Статья успешно создана',
        deleted: 'Статья успешно удалена',
        error: 'Ошибка при сохранении статьи',
      },
    },
  },
};

const i18nProvider = polyglotI18nProvider(() => customRussianMessages, 'ru');

export default i18nProvider;
