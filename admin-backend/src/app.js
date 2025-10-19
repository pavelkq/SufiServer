const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const resourceRoutes = require('./routes/resourceRoutes'); // Уже есть
const articleRoutes = require('./routes/articleRoutes');   // Новые маршруты для статей
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// Настройка CORS
app.use(cors({
  origin: 'http://localhost:3000', // Адрес вашего фронтенда — поправьте, если нужен другой
  credentials: true,
  exposedHeaders: ['Content-Range'], // Чтобы фронтенд видел заголовок Content-Range
}));

// Парсинг JSON в теле запросов с увеличенным лимитом
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Статическая раздача загруженных файлов статей (путь должен совпадать с путём в articleController)
app.use('/uploads/articles', express.static(path.join(__dirname, '../../uploads/articles')));

// Тестовый роут для проверки работы сервера
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Прокидываем основные API маршруты
app.use('/api/admin-backend/users', userRoutes);
app.use('/api/admin-backend/groups', groupRoutes);
app.use('/api/admin-backend/resources', resourceRoutes);
app.use('/api/admin-backend/articles', articleRoutes); // Подключаем маршруты статей

// Глобальный обработчик ошибок
app.use(errorMiddleware);

module.exports = app;