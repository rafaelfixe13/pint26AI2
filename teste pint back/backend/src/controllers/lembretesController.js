const Lembrete = require('../models/Lembrete');
const { agendarLembrete } = require('../jobs/expiracaoBadges');

// GET /api/lembretes?utilizador_id=X
const listarLembretes = async (req, res) => {
  const { utilizador_id } = req.query;
  if (!utilizador_id) return res.status(400).json({ message: 'utilizador_id é obrigatório.' });
  try {
    const lembretes = await Lembrete.findAll({
      where: { utilizador_id },
      order: [['concluido', 'ASC'], ['prazo', 'ASC']],
    });
    res.json(lembretes);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao listar lembretes.', error: e.message });
  }
};

// POST /api/lembretes
const criarLembrete = async (req, res) => {
  const { utilizador_id, titulo, descricao, badge_id, badge_nome, prazo } = req.body;
  if (!utilizador_id || !titulo || !prazo) {
    return res.status(400).json({ message: 'utilizador_id, titulo e prazo são obrigatórios.' });
  }
  try {
    const lembrete = await Lembrete.create({
      utilizador_id,
      titulo,
      descricao: descricao || null,
      badge_id: badge_id || null,
      badge_nome: badge_nome || null,
      prazo,
    });
    // Dispara já se o prazo passou, ou agenda o aviso para o momento exato do prazo.
    agendarLembrete(lembrete.id, lembrete.prazo);
    res.status(201).json(lembrete);
  } catch (e) {
    res.status(500).json({ message: 'Erro ao criar lembrete.', error: e.message });
  }
};

// PATCH /api/lembretes/:id/concluido  (alterna concluído)
const toggleConcluido = async (req, res) => {
  try {
    const lembrete = await Lembrete.findByPk(req.params.id);
    if (!lembrete) return res.status(404).json({ message: 'Lembrete não encontrado.' });
    await lembrete.update({ concluido: !lembrete.concluido });
    res.json({ concluido: lembrete.concluido });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao atualizar lembrete.', error: e.message });
  }
};

// DELETE /api/lembretes/:id
const eliminarLembrete = async (req, res) => {
  try {
    const apagado = await Lembrete.destroy({ where: { id: req.params.id } });
    if (!apagado) return res.status(404).json({ message: 'Lembrete não encontrado.' });
    res.json({ message: 'Lembrete eliminado.' });
  } catch (e) {
    res.status(500).json({ message: 'Erro ao eliminar lembrete.', error: e.message });
  }
};

module.exports = {
  listarLembretes,
  criarLembrete,
  toggleConcluido,
  eliminarLembrete,
};
