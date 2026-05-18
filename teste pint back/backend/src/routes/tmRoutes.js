const express = require('express');
const router = express.Router();

const {
  listarBadgesEspeciais,
  listarRanking,
  listarConsultores,
} = require('../controllers/tmController');

router.get('/badgesespeciais', listarBadgesEspeciais);
router.get('/ranking', listarRanking);
router.get('/consultores', listarConsultores);

module.exports = router;