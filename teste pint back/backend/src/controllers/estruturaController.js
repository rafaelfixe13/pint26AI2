const LearningPath = require('../models/LearningPath');
const ServiceLine = require('../models/ServiceLine');
const Area = require('../models/Area');
const Nivel = require('../models/Nivel');
const Requisito = require('../models/Requisito');
const { sequelize } = require('../config/database');

//Utilitario de toggle
const toggle = async (Model, pk, pkField, res) => {
  try {
    const item = await Model.findByPk(pk);
    if (!item) return res.status(404).json({ error: 'Registo não encontrado.' });
    await item.update({ ativo: !item.ativo });
    res.json({ ativo: item.ativo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//Lp

const listarLearningPaths = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT idlearningpath, nome, descricao, ativo FROM learningpaths ORDER BY idlearningpath',
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const criarLearningPath = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    const lp = await LearningPath.create({ nome, descricao: descricao || null });
    res.status(201).json(lp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const editarLearningPath = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    const [updated] = await LearningPath.update(
      { nome, descricao: descricao || null },
      { where: { idlearningpath: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: 'Learning path não encontrado.' });
    res.json({ message: 'Learning path atualizado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const toggleLearningPath = async (req, res) => toggle(LearningPath, req.params.id, 'idlearningpath', res);

//SL

const listarServiceLines = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT idserviceline, nome, descricao, ativo FROM serviceline ORDER BY idserviceline',
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const criarServiceLine = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    const sl = await ServiceLine.create({ nome, descricao: descricao || null });
    res.status(201).json(sl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const editarServiceLine = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    const [updated] = await ServiceLine.update(
      { nome, descricao: descricao || null },
      { where: { idserviceline: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: 'Service line não encontrada.' });
    res.json({ message: 'Service line atualizada.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const toggleServiceLine = async (req, res) => toggle(ServiceLine, req.params.id, 'idserviceline', res);

//Areas

const criarArea = async (req, res) => {
  const { idserviceline, nome, descricao } = req.body;
  if (!idserviceline || !nome) return res.status(400).json({ error: 'idserviceline e nome são obrigatórios.' });
  try {
    const area = await Area.create({ idserviceline, nome, descricao: descricao || null });
    res.status(201).json(area);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const editarArea = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    const [updated] = await Area.update(
      { nome, descricao: descricao || null },
      { where: { idarea: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: 'Área não encontrada.' });
    res.json({ message: 'Área atualizada.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const toggleArea = async (req, res) => toggle(Area, req.params.id, 'idarea', res);

//niveis

const criarNivel = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) {
    return res.status(400).json({ error: 'nome é obrigatório.' });
  }
  try {
    const nivel = await Nivel.create({ nome, descricao: descricao || null });
    res.status(201).json(nivel);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const editarNivel = async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
  try {
    const [updated] = await Nivel.update(
      { nome, descricao: descricao || null },
      { where: { idnivel: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: 'Nível não encontrado.' });
    res.json({ message: 'Nível atualizado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const toggleNivel = async (req, res) => toggle(Nivel, req.params.id, 'idnivel', res);

const apagarNivel = async (req, res) => {
  const id = req.params.id;
  try {
    const [{ total }] = await sequelize.query(
      'SELECT COUNT(*)::int AS total FROM badges WHERE idnivel = :id',
      { replacements: { id }, type: sequelize.QueryTypes.SELECT }
    );
    if (total > 0) {
      return res.status(409).json({
        error: `Não é possível apagar: ${total} badge(s) usam este nível. Altera o nível desses badges primeiro.`,
        badges: total,
      });
    }
    const apagados = await Nivel.destroy({ where: { idnivel: id } });
    if (!apagados) return res.status(404).json({ error: 'Nível não encontrado.' });
    res.json({ message: 'Nível apagado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

//requisitos

const criarRequisito = async (req, res) => {
  const { idbadge, codigo, titulo, descricao, imagemurl, ordem } = req.body;
  if (!idbadge || !codigo || !titulo || !descricao) {
    return res.status(400).json({ error: 'idbadge, codigo, titulo e descricao são obrigatórios.' });
  }
  try {
    const req_ = await Requisito.create({
      idbadge, codigo, titulo, descricao,
      imagemurl: imagemurl || null,
      ordem: ordem || null,
    });
    res.status(201).json(req_);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const editarRequisito = async (req, res) => {
  const { codigo, titulo, descricao, imagemurl } = req.body;
  if (!codigo || !titulo || !descricao) {
    return res.status(400).json({ error: 'Codigo, titulo e descricao são obrigatórios.' });
  }
  try {
    const [updated] = await Requisito.update(
      { codigo, titulo, descricao, imagemurl: imagemurl || null },
      { where: { idrequisito: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: 'Requisito não encontrado.' });
    res.json({ message: 'Requisito atualizado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const toggleRequisito = async (req, res) => toggle(Requisito, req.params.id, 'idrequisito', res);

module.exports = {
  listarLearningPaths, criarLearningPath, editarLearningPath, toggleLearningPath,
  listarServiceLines, criarServiceLine, editarServiceLine, toggleServiceLine,
  criarArea, editarArea, toggleArea,
  criarNivel, editarNivel, toggleNivel, apagarNivel,
  criarRequisito, editarRequisito, toggleRequisito,
};