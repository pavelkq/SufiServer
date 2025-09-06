const { findUserByEmail, updateUserPassword } = require('../models/userModel');
const { createResetToken, findValidToken, markTokenUsed } = require('../models/passwordResetTokenModel');
const { sendPasswordResetEmail } = require('../services/emailService');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const RESET_TOKEN_EXPIRY_MINUTES = 60;

async function requestPasswordReset(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email обязателен' });
    const user = await findUserByEmail(email);

    // Чтобы не палить info об аккаунтах, всегда успешный ответ
    if (user) {
        const token = crypto.randomBytes(48).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60000);
        await createResetToken(user.id, token, expiresAt);
        await sendPasswordResetEmail(user.email, token);
    }

    res.json({ message: 'Если такой email зарегистрирован, письмо отправлено' });
}

async function confirmPasswordReset(req, res) {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Токен и пароль обязательны' });

    const record = await findValidToken(token);
    if (!record) return res.status(400).json({ error: 'Некорректный или просроченный токен' });

    const hash = await bcrypt.hash(password, 10);
    await updateUserPassword(record.user_id, hash);
    await markTokenUsed(token);
    res.json({ message: 'Пароль успешно изменён' });
}

module.exports = {
    requestPasswordReset,
    confirmPasswordReset,
};
