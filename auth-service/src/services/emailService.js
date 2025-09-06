const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const buildConfirmationLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/api/admin-backend/users/confirm-email?token=${token}`;
};

const buildPasswordResetLink = (token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/reset-password?token=${token}`;
};

async function sendConfirmationEmail(email, token) {
  const confirmationLink = buildConfirmationLink(token);

  const mailOptions = {
    from: `"Sufi Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Подтверждение электронной почты',
    html: `
      <p>Спасибо за регистрацию!</p>
      <p>Перейдите по ссылке, чтобы подтвердить ваш email:</p>
      <a href="${confirmationLink}">${confirmationLink}</a>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendPasswordResetEmail(email, token) {
  const resetLink = buildPasswordResetLink(token);

  const mailOptions = {
    from: `"Sufi Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Восстановление пароля',
    html: `
      <p>Вы запросили сброс пароля.</p>
      <p>Если вы ничего не запрашивали, проигнорируйте это письмо.</p>
      <p>Иначе перейдите по ссылке, чтобы задать новый пароль:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Ссылка действительна ограниченное время.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail,
};
