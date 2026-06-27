const express = require('express');
const router = express.Router();
const {
  definirBadgePublico,
  pesquisarConsultores,
  getConsultorPublico,
  getVerificacao,
} = require('../controllers/publicoController');


router.get('/consultores', pesquisarConsultores);

router.get('/consultor/:id', getConsultorPublico);

router.get('/verificar/:idcandidatura', getVerificacao);

router.patch('/badge', definirBadgePublico);

module.exports = router;
