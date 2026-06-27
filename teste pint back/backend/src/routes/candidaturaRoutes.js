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

router.get('/minhas',       listarMinhasCandidaturas);
router.get('/badge-estado', estadoCandidatura);
router.get('/tm/lista',     listarCandidaturasTM);
router.get('/sl/lista',     listarCandidaturasSL);

router.post('/', criarCandidatura);

router.get('/:id',    detalhesCandidatura);
router.put('/:id/tm', validarTM);
router.put('/:id/sl', validarSL);

module.exports = router;