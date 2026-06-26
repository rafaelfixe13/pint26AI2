const express = require('express');
const router = express.Router();
const { getPolitica, atualizarPolitica } = require('../controllers/politicaController');

router.get('/', getPolitica);
router.put('/', atualizarPolitica);

module.exports = router;
