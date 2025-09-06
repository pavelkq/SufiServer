const express = require('express');
const { requestPasswordReset, confirmPasswordReset } = require('../controllers/passwordResetController');
const router = express.Router();

router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);

module.exports = router;
