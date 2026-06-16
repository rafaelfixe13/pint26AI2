const express = require('express');
const router = express.Router();
const {
  listarLembretes,
  criarLembrete,
  toggleConcluido,
  eliminarLembrete,
} = require('../controllers/lembretesController');

router.get('/', listarLembretes);
router.post('/', criarLembrete);
router.patch('/:id/concluido', toggleConcluido);
router.delete('/:id', eliminarLembrete);

module.exports = router;
