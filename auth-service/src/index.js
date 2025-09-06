require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const passwordResetRoutes = require('./routes/passwordReset'); // <--- добавили!

const app = express();

// Логирование всех HTTP-запросов в формате Apache combined
app.use(morgan('combined'));

// Парсинг JSON в теле запросов
app.use(express.json());

// Роуты авторизации
app.use('/auth', authRoutes);

// Роуты сброса пароля
app.use(passwordResetRoutes);  // <--- вот так

// Эндпоинт для проверки здоровья сервиса
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Обработка ошибок — логируем и возвращаем 500
app.use((err, req, res, next) => {
  console.error('Ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера на порту из env или 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth-service started on port ${PORT}`);
});
