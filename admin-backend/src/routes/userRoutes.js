const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const checkAdminRole = require('../middleware/checkAdminRole');

// Публичный маршрут подтверждения email — без авторизации
router.get('/confirm-email', userController.confirmEmail);

// Все остальные маршруты требуют авторизации
router.use(authMiddleware);

// Маршрут смены пароля — для любого авторизованного пользователя (без проверки admin)
router.post('/change-password', userController.changePassword);

// Далее — только админы могут работать с пользователями
router.use(checkAdminRole);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.put('/group', userController.updateUserGroup);
router.post('/send-confirmation-email', userController.sendEmailConfirmation);
router.delete('/:id', userController.deleteUser);

module.exports = router;
