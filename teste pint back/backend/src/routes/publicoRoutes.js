const express = require('express');
const router = express.Router();
const {
  definirBadgePublico,
  pesquisarConsultores,
  getConsultorPublico,
  getVerificacao,
} = require('../controllers/publicoController');

// Pesquisar consultores por nome
router.get('/consultores', pesquisarConsultores);

// Perfil público de um consultor (badges marcados como públicos)
router.get('/consultor/:id', getConsultorPublico);

// Verificação pública de uma credencial (badge atribuído a um consultor)
router.get('/verificar/:idcandidatura', getVerificacao);

// Marcar/desmarcar um badge como público
router.patch('/badge', definirBadgePublico);

module.exports = router;
