const bcrypt = require('bcrypt');
const {
  getUsersWithPagination,
  getUsersCount,
  updateGroup,
  setEmailConfirmationToken,
  confirmEmailByToken,
  getUserById,
  deleteUserById,
  updateUserById,
  updateUserPassword,
} = require('../models/User');
const { sendConfirmationEmail } = require('../services/emailService');

const API_BASE_URL = process.env.API_BASE_URL || 'http://188.127.230.92:8090';

// Помощник для безопасного парсинга параметров
function parseIfString(value, defaultValue) {
  if (!value) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return defaultValue;
    }
  }
  return value;
}

/**
 * Получить список пользователей с пагинацией, фильтрами, сортировкой
 * Возвращает объект вида { data: [...], total: количество }
 */
async function getUsers(req, res, next) {
  try {
    const range = parseIfString(req.query.range, [0, 9]);
    const filter = parseIfString(req.query.filter, {});
    const sort = parseIfString(req.query.sort, ['id', 'ASC']);

    const users = await getUsersWithPagination(range, filter, sort);
    const totalCount = await getUsersCount(filter);

    const lastIndex = Math.min(range[1], totalCount - 1);

    res.set('Content-Range', `users ${range[0]}-${lastIndex}/${totalCount}`);
    res.set('Access-Control-Expose-Headers', 'Content-Range');

    res.json({
      data: users,
      total: totalCount,
    });
  } catch (err) {
    console.error('Error in getUsers:', err);
    next(err);
  }
}

/**
 * Обновить группу пользователя
 */
async function updateUserGroup(req, res, next) {
  try {
    const { userId, groupId } = req.body;
    await updateGroup(userId, groupId);
    res.json({ message: 'User group updated' });
  } catch (err) {
    console.error('Error in updateUserGroup:', err);
    next(err);
  }
}

/**
 * Отправить письмо подтверждения email
 */
async function sendEmailConfirmation(req, res, next) {
  try {
    const { userId } = req.body;
    const token = await setEmailConfirmationToken(userId);
    const user = await getUserById(userId);

    await sendConfirmationEmail(user.email, token);

    res.json({ message: 'Письмо подтверждения отправлено' });
  } catch (err) {
    console.error('Error in sendEmailConfirmation:', err);
    next(err);
  }
}

/**
 * Подтвердить email по токену
 */
async function confirmEmail(req, res, next) {
  try {
    const { token } = req.query;

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    });

    if (!token) {
      return res.status(400).send(`<h1>Ошибка подтверждения</h1><p>Токен не задан или ссылка некорректна.</p>`);
    }

    const user = await confirmEmailByToken(token);
    if (!user) {
      return res.status(400).send(`<h1>Ошибка подтверждения</h1><p>Токен недействителен или устарел.</p>`);
    }

    return res.send(`<h1>Email успешно подтверждён!</h1><p>Спасибо за подтверждение email.</p>`);
  } catch (err) {
    console.error('Error in confirmEmail:', err);
    next(err);
  }
}

/**
 * Получить пользователя по ID
 */
async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch (err) {
    console.error('Error in getUser:', err);
    next(err);
  }
}

/**
 * Обновить пользователя по ID
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedUser = await updateUserById(id, updates);
    if (!updatedUser) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(updatedUser);
  } catch (err) {
    console.error('Error in updateUser:', err);
    next(err);
  }
}

/**
 * Удалить пользователя по ID
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const deletedUser = await deleteUserById(id);
    if (!deletedUser) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    next(err);
  }
}

/**
 * Смена пароля авторизованного пользователя
 */
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Текущий и новый пароли обязательны' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Новый пароль должен содержать минимум 8 символов' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Текущий пароль неверный' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, hashedPassword);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('Error in changePassword:', err);
    next(err);
  }
}

module.exports = {
  getUsers,
  getUser,
  updateUserGroup,
  sendEmailConfirmation,
  confirmEmail,
  updateUser,
  deleteUser,
  changePassword,
};
