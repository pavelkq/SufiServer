module.exports = function (req, res, next) {
  if (!req.user || req.user.role !== 5) {
    return res.status(403).json({ message: 'Доступ запрещён: нужны права администратора' });
  }
  next();
};
