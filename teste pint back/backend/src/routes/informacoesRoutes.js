const express = require('express');
const router = express.Router();
const {
  listarInformacoes,
  listarPublicas,
  criarInformacao,
  editarInformacao,
  toggleInformacao,
} = require('../controllers/informacoesController');

// Públicas (Sobre/Ajuda): apenas ativas
router.get('/publicas', listarPublicas);

// Gestão (admin)
router.get('/', listarInformacoes);
router.post('/', criarInformacao);
router.put('/:id', editarInformacao);
router.patch('/:id/ativo', toggleInformacao);

module.exports = router;
