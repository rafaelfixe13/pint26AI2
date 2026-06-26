const Informacao = require('../models/Informacao');
const Notificacao = require('../models/Notificacao');
const { sequelize } = require('../config/database');

const TIPOS_VALIDOS = ['sobre', 'ajuda', 'aviso'];

// Cria uma notificação (in-app) para todos os utilizadores — usado ao publicar um aviso.
const notificarAviso = async (titulo, mensagem) => {
  const utilizadores = await sequelize.query(
    'SELECT idutilizador FROM utilizadores',
    { type: sequelize.QueryTypes.SELECT }
  );
  if (!utilizadores.length) return;
  const registos = utilizadores.map((u) => ({
    idutilizador: u.idutilizador, titulo, mensagem, tipo: 'aviso',
  }));
  await Notificacao.bulkCreate(registos);
};

// GET /api/informacoes  (admin) — todas, com filtro opcional ?tipo=
const listarInformacoes = async (req, res) => {
  try {
    const { tipo } = req.query;
    const where = {};
    if (tipo && TIPOS_VALIDOS.includes(tipo)) where.tipo = tipo;
    const lista = await Informacao.findAll({
      where,
      order: [['ordem', 'ASC'], ['datacriacao', 'DESC']],
    });
    return res.json(lista);
  } catch (err) {
    console.error('Erro ao listar informações:', err);
    return res.status(500).json({ message: 'Erro ao listar informações.' });
  }
};

// GET /api/informacoes/publicas?tipo=sobre — apenas ativas (para Sobre/Ajuda)
const listarPublicas = async (req, res) => {
  try {
    const { tipo } = req.query;
    const where = { ativo: true };
    if (tipo && TIPOS_VALIDOS.includes(tipo)) where.tipo = tipo;
    const lista = await Informacao.findAll({
      where,
      order: [['ordem', 'ASC'], ['datacriacao', 'DESC']],
    });
    return res.json(lista);
  } catch (err) {
    console.error('Erro ao listar informações públicas:', err);
    return res.status(500).json({ message: 'Erro ao listar informações.' });
  }
};

// POST /api/informacoes — cria; se for um aviso ativo, gera notificação a todos
const criarInformacao = async (req, res) => {
  const { tipo, titulo, conteudo, ativo, ordem } = req.body;
  if (!titulo || !conteudo) {
    return res.status(400).json({ message: 'Título e conteúdo são obrigatórios.' });
  }
  const tipoFinal = TIPOS_VALIDOS.includes(tipo) ? tipo : 'aviso';
  try {
    const nova = await Informacao.create({
      tipo: tipoFinal,
      titulo,
      conteudo,
      ativo: ativo !== undefined ? !!ativo : true,
      ordem: Number.isInteger(ordem) ? ordem : 0,
    });

    if (nova.tipo === 'aviso' && nova.ativo) {
      try {
        await notificarAviso(nova.titulo, nova.conteudo);
      } catch (e) {
        console.error('Falha ao notificar aviso:', e.message);
      }
    }

    return res.status(201).json(nova);
  } catch (err) {
    console.error('Erro ao criar informação:', err);
    return res.status(500).json({ message: 'Erro ao criar informação.' });
  }
};

// PUT /api/informacoes/:id — editar conteúdo
const editarInformacao = async (req, res) => {
  const { id } = req.params;
  const { tipo, titulo, conteudo, ordem } = req.body;
  try {
    const info = await Informacao.findByPk(id);
    if (!info) return res.status(404).json({ message: 'Informação não encontrada.' });

    const dados = {};
    if (tipo !== undefined && TIPOS_VALIDOS.includes(tipo)) dados.tipo = tipo;
    if (titulo !== undefined) dados.titulo = titulo;
    if (conteudo !== undefined) dados.conteudo = conteudo;
    if (ordem !== undefined && Number.isInteger(ordem)) dados.ordem = ordem;

    await info.update(dados);
    return res.json(info);
  } catch (err) {
    console.error('Erro ao editar informação:', err);
    return res.status(500).json({ message: 'Erro ao editar informação.' });
  }
};

// PATCH /api/informacoes/:id/ativo — alternar ativo/inativo
const toggleInformacao = async (req, res) => {
  const { id } = req.params;
  try {
    const info = await Informacao.findByPk(id);
    if (!info) return res.status(404).json({ message: 'Informação não encontrada.' });
    await info.update({ ativo: !info.ativo });
    return res.json({ ativo: info.ativo });
  } catch (err) {
    console.error('Erro ao alterar estado da informação:', err);
    return res.status(500).json({ message: 'Erro ao alterar estado.' });
  }
};

module.exports = {
  listarInformacoes,
  listarPublicas,
  criarInformacao,
  editarInformacao,
  toggleInformacao,
};
