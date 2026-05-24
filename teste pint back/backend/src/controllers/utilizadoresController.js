const { sequelize } = require('../config/database');
const Utilizador = require('../models/Utilizador');

const atualizarPerfil = async (req, res) => {
  const { id } = req.params;
  const { idserviceline, idarea } = req.body;
  try {
    const utilizador = await Utilizador.findByPk(id);
    if (!utilizador) return res.status(404).json({ message: 'Utilizador não encontrado.' });

    const updates = {};
    if (idserviceline !== undefined) updates.idserviceline = idserviceline ?? null;
    if (idarea        !== undefined) updates.idarea        = idarea        ?? null;

    await utilizador.update(updates);
    return res.json({ idserviceline: utilizador.idserviceline, idarea: utilizador.idarea });
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const atualizarFoto = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: 'Nenhum ficheiro enviado.' });
  try {
    const baseUrl = 'http://localhost:3000';
    const fotourl = `${baseUrl}/uploads/${req.file.filename}`;
    await Utilizador.update({ fotourl }, { where: { idutilizador: id } });
    return res.json({ fotourl });
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const getRanking = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT idutilizador, nome, pontos, fotourl
       FROM utilizadores
       WHERE estadoconta = 'ATIVA'
       ORDER BY pontos DESC
       LIMIT 50`,
      { type: sequelize.QueryTypes.SELECT }
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao obter ranking:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

const atualizarFotoBase64 = async (req, res) => {
  const { id } = req.params;
  const { fotourl } = req.body;
  if (!fotourl) return res.status(400).json({ message: 'Foto em falta.' });
  try {
    await Utilizador.update({ fotourl }, { where: { idutilizador: id } });
    return res.json({ message: 'Foto atualizada com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar foto base64:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

module.exports = { atualizarFoto, atualizarPerfil, getRanking, atualizarFotoBase64 };