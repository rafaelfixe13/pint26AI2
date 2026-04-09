const express = require('express');
const router = express.Router();
const { login, register, confirmarEmail, alterarPassword, adicionarRole, removerRole } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.post('/confirmar', confirmarEmail);
router.post('/alterar-password', alterarPassword);
router.post('/roles/adicionar', adicionarRole);
router.post('/roles/remover', removerRole);

module.exports = router;
