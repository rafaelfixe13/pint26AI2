const PoliticaRgpd = require('../models/PoliticaRgpd');
const { sequelize } = require('../config/database');

// GET /api/politica-rgpd — devolve a política ativa (a mais recente)
const getPolitica = async (_req, res) => {
  try {
    const politica = await PoliticaRgpd.findOne({
      where: { ativo: true },
      order: [['versao', 'DESC'], ['dataatualizacao', 'DESC']],
    });
    return res.json(politica || null);
  } catch (err) {
    console.error('Erro ao obter política RGPD:', err);
    return res.status(500).json({ message: 'Erro ao obter política.' });
  }
};

// PUT /api/politica-rgpd — atualiza o conteúdo e força todos a reaceitar
const atualizarPolitica = async (req, res) => {
  const { titulo, conteudo } = req.body;
  if (!titulo || !conteudo) {
    return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
  }
  try {
    let politica = await PoliticaRgpd.findOne({
      where: { ativo: true },
      order: [['versao', 'DESC']],
    });

    if (politica) {
      await politica.update({
        titulo,
        conteudo,
        versao: politica.versao + 1,
        dataatualizacao: new Date(),
      });
    } else {
      politica = await PoliticaRgpd.create({ titulo, conteudo, versao: 1, ativo: true });
    }

    // Ao alterar o conteúdo, repõe o consentimento de todos para false (reaceitação obrigatória).
    await sequelize.query('UPDATE utilizadores SET rgpd = false');

    return res.json({
      message: 'Política atualizada. Todos os utilizadores terão de reaceitar.',
      politica,
    });
  } catch (err) {
    console.error('Erro ao atualizar política RGPD:', err);
    return res.status(500).json({ message: 'Erro ao atualizar política.' });
  }
};

module.exports = { getPolitica, atualizarPolitica };
