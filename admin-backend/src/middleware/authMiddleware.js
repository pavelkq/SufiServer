const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Нет токена авторизации' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен не найден' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Неверный токен' });
    req.user = user;
    next();
  });
};
