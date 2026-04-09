const LearningPath = require('../models/LearningPath');
const ServiceLine = require('../models/ServiceLine');
const Area = require('../models/Area');
const Nivel = require('../models/Nivel');
const Requisito = require('../models/Requisito');
const { sequelize } = require('../config/database');

// ── Utilitário de toggle ───────────────────────────────────────
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

// ── LEARNING PATHS ─────────────────────────────────────────────

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

// ── SERVICE LINES ──────────────────────────────────────────────

const listarServiceLines = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      'SELECT idserviceline, nome, descricao, ativo FROM servicelines ORDER BY idserviceline',
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

// ── ÁREAS ──────────────────────────────────────────────────────

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

// ── NÍVEIS ─────────────────────────────────────────────────────

const criarNivel = async (req, res) => {
  const { idlearningpath, idarea, codigo, nome, descricao } = req.body;
  if (!idlearningpath || !idarea || !codigo || !nome) {
    return res.status(400).json({ error: 'idlearningpath, idarea, codigo e nome são obrigatórios.' });
  }
  try {
    const nivel = await Nivel.create({ idlearningpath, idarea, codigo, nome, descricao: descricao || null });
    res.status(201).json(nivel);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const editarNivel = async (req, res) => {
  const { idlearningpath, codigo, nome, descricao } = req.body;
  if (!codigo || !nome) return res.status(400).json({ error: 'Codigo e nome são obrigatórios.' });
  try {
    const updates = { codigo, nome, descricao: descricao || null };
    if (idlearningpath) updates.idlearningpath = idlearningpath;
    const [updated] = await Nivel.update(updates, { where: { idnivel: req.params.id } });
    if (!updated) return res.status(404).json({ error: 'Nível não encontrado.' });
    res.json({ message: 'Nível atualizado.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const toggleNivel = async (req, res) => toggle(Nivel, req.params.id, 'idnivel', res);

// ── REQUISITOS ─────────────────────────────────────────────────

const criarRequisito = async (req, res) => {
  const { idnivel, codigo, titulo, descricao, imagemurl } = req.body;
  if (!idnivel || !codigo || !titulo || !descricao) {
    return res.status(400).json({ error: 'idnivel, codigo, titulo e descricao são obrigatórios.' });
  }
  try {
    const req_ = await Requisito.create({ idnivel, codigo, titulo, descricao, imagemurl: imagemurl || null });
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
  criarNivel, editarNivel, toggleNivel,
  criarRequisito, editarRequisito, toggleRequisito,
};
