const express = require('express');
const router = express.Router();

const {
  listarBadgesEspeciais,
  listarRanking,
} = require('../controllers/tmController');

router.get('/badgesespeciais', listarBadgesEspeciais);
router.get('/ranking', listarRanking);

module.exports = router;