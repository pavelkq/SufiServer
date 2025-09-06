const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
  },
});

async function sendConfirmationEmail(toEmail, token) {
  const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL;

  const confirmUrl = `${baseUrl}/api/admin-backend/users/confirm-email?token=${token}`;

  const mailOptions = {
    from: `"Sufi Admin" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Подтверждение email',
    html: `<p>Пожалуйста, подтвердите ваш email, перейдя по ссылке:</p>
           <a href="${confirmUrl}">${confirmUrl}</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Письмо подтверждения отправлено на ${toEmail}`);
  } catch (error) {
    console.error(`Ошибка при отправке письма на ${toEmail}:`, error);
    throw error;
  }
}

module.exports = { sendConfirmationEmail };
