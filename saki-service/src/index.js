require('dotenv').config();
const express = require('express');
const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 4000;

// Добавляем healthcheck эндпоинт
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

// Функция ожидания готовности базы данных
async function waitForDb(pool, retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('База данных доступна');
      return;
    } catch (err) {
      console.log(`Ожидание базы данных... попытка ${i + 1}`);
      console.log('DB_NAME:', process.env.DB_NAME);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Не удалось подключиться к базе данных');
}

app.get('/daily/:date', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT main_text, comment_text FROM daily_content WHERE date = $1`,
      [req.params.date]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Текст не найден" });
    }

    res.json({
      mainText: rows[0].main_text,
      comment: rows[0].comment_text
    });
  } catch (err) {
    console.error('Ошибка при обработке запроса /daily/:date:', err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

(async () => {
  try {
    await waitForDb(pool);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Сервис Чаша Саки запущен на порту ${PORT}`);
      console.log('DB_NAME:', process.env.DB_NAME);
    });
  } catch (err) {
    console.error('Ошибка при запуске сервиса:', err);
    process.exit(1);
  }
})();
