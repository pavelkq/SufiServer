const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const { findUserByEmail, createUser } = require('../models/userModel');
const { sendConfirmationEmail } = require('../services/emailService');
const crypto = require('crypto');
const pool = require('../db');

const saltRounds = 10;

async function register(req, res) {
  const { email, password, name = '' } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await createUser(email, passwordHash, name);

    // Генерация токена email подтверждения
    const emailConfirmToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET email_confirmation_token = $1 WHERE id = $2',
      [emailConfirmToken, user.id]
    );

    // Отправка письма с подтверждением через auth-service emailService
    await sendConfirmationEmail(email, emailConfirmToken);

    const token = generateToken(user);

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    // Проверка подтверждения email
    if (!user.email_confirmed) {
      return res.status(403).json({ error: 'Email не подтверждён. Пожалуйста, подтвердите email для входа.' });
    }
    
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
