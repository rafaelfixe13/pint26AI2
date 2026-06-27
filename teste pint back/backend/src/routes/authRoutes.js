const express = require('express');
const router = express.Router();
const { login, confirmarEmail, definirPassword, alterarPassword, registar, listarAreas, recuperarPassword, redefinirPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', registar);
router.get('/areas', listarAreas);
router.post('/confirmar', confirmarEmail);
router.post('/definir-password', definirPassword);
router.post('/alterar-password', alterarPassword);
router.post('/recuperar', recuperarPassword);
router.post('/redefinir', redefinirPassword);

module.exports = router;