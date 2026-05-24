const express = require('express');
const router = express.Router();
const {
  criarCandidatura,
  listarMinhasCandidaturas,
  listarCandidaturasTM,
  validarTM,
  listarCandidaturasSL,
  validarSL,
  detalhesCandidatura,
  estadoCandidatura,
} = require('../controllers/candidaturaController');

// Rotas sem parâmetro — devem vir ANTES de /:id
router.get('/minhas',       listarMinhasCandidaturas);
router.get('/badge-estado', estadoCandidatura);
router.get('/tm/lista',     listarCandidaturasTM);
router.get('/sl/lista',     listarCandidaturasSL);

// ✅ Sem multer — recebe JSON com base64
router.post('/', criarCandidatura);

// Acções por id — DEPOIS das rotas estáticas
router.get('/:id',    detalhesCandidatura);
router.put('/:id/tm', validarTM);
router.put('/:id/sl', validarSL);

module.exports = router;