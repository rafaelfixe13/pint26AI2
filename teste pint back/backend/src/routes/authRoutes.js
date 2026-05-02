const express = require('express');
const router = express.Router();
const { login, confirmarEmail, definirPassword, alterarPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/confirmar', confirmarEmail);
router.post('/definir-password', definirPassword);
router.post('/alterar-password', alterarPassword);

module.exports = router;