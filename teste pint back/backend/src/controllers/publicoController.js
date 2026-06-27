const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

//marcar/desmarcar um badge conquistado como publico
const definirBadgePublico = async (req, res) => {
  const { idutilizador, idbadge, publico } = req.body;
  if (idutilizador == null || idbadge == null) {
    return res.status(400).json({ message: 'idutilizador e idbadge são obrigatórios.' });
  }
  try {
    const [result] = await sequelize.query(
      `UPDATE candidaturasbadge
       SET publico = :publico
       WHERE user_id = :idutilizador AND badge_id = :idbadge AND UPPER(estado) = 'APPROVED'
       RETURNING idcandidatura`,
      { replacements: { publico: !!publico, idutilizador, idbadge } }
    );
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Badge aprovado não encontrado para este utilizador.' });
    }
    return res.json({ message: 'Visibilidade atualizada.', publico: !!publico });
  } catch (err) {
    console.error('Erro ao definir badge público:', err.message);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

//pesquisar consultores
const pesquisarConsultores = async (req, res) => {
  const { nome = '' } = req.query;
  try {
    const rows = await sequelize.query(
      `SELECT u.idutilizador, u.nome, u.fotourl,
              sl.nome AS serviceline, a.nome AS area,
              COUNT(c.idcandidatura)
                FILTER (WHERE UPPER(c.estado) = 'APPROVED' AND c.publico = true) AS publicos
       FROM utilizadores u
       LEFT JOIN serviceline sl ON sl.idserviceline = u.idserviceline
       LEFT JOIN areas a        ON a.idarea         = u.idarea
       LEFT JOIN candidaturasbadge c ON c.user_id = u.idutilizador
       WHERE u.idrole = 1 AND u.estadoconta = 'ATIVA' AND u.nome ILIKE :nome
       GROUP BY u.idutilizador, sl.nome, a.nome
       ORDER BY u.nome`,
      { replacements: { nome: `%${nome}%` }, type: QueryTypes.SELECT }
    );
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao pesquisar consultores:', err.message);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

//perfil com os abdges marcados como publico
const getConsultorPublico = async (req, res) => {
  const { id } = req.params;
  try {
    const [info] = await sequelize.query(
      `SELECT u.idutilizador, u.nome, u.fotourl, COALESCE(u.pontos, 0) AS pontos,
              sl.nome AS serviceline, a.nome AS area
       FROM utilizadores u
       LEFT JOIN serviceline sl ON sl.idserviceline = u.idserviceline
       LEFT JOIN areas a        ON a.idarea         = u.idarea
       WHERE u.idutilizador = :id AND u.idrole = 1`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!info) return res.status(404).json({ message: 'Consultor não encontrado.' });

    const badges = await sequelize.query(
      `SELECT c.idcandidatura, b.idbadge, b.nome, b.imagemurl, b.pontos,
              nv.nome AS nivel, ar.nome AS area, sl.nome AS serviceline,
              c.dataaprovacao AS dataconquista
       FROM candidaturasbadge c
       JOIN badges b        ON b.idbadge = c.badge_id
       LEFT JOIN nivel nv   ON nv.idnivel = b.idnivel
       LEFT JOIN areas ar   ON ar.idarea = b.idarea
       LEFT JOIN serviceline sl ON sl.idserviceline = ar.idserviceline
       WHERE c.user_id = :id AND UPPER(c.estado) = 'APPROVED' AND c.publico = true
       ORDER BY c.dataaprovacao DESC`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    return res.json({ ...info, badges });
  } catch (err) {
    console.error('Erro ao obter consultor público:', err.message);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

//verificacao de um badge conquistado
const getVerificacao = async (req, res) => {
  const { idcandidatura } = req.params;
  try {
    const [row] = await sequelize.query(
      `SELECT c.idcandidatura, c.dataaprovacao AS dataconquista,
              u.idutilizador AS consultor_id, u.nome AS consultor_nome, u.fotourl AS consultor_foto,
              b.idbadge, b.nome AS badge_nome, b.imagemurl AS badge_imagem, b.pontos,
              b.descricao, b.competencias,
              nv.nome AS nivel, ar.nome AS area, sl.nome AS serviceline
       FROM candidaturasbadge c
       JOIN utilizadores u ON u.idutilizador = c.user_id
       JOIN badges b       ON b.idbadge = c.badge_id
       LEFT JOIN nivel nv  ON nv.idnivel = b.idnivel
       LEFT JOIN areas ar  ON ar.idarea = b.idarea
       LEFT JOIN serviceline sl ON sl.idserviceline = ar.idserviceline
       WHERE c.idcandidatura = :idcandidatura
         AND UPPER(c.estado) = 'APPROVED' AND c.publico = true`,
      { replacements: { idcandidatura }, type: QueryTypes.SELECT }
    );
    if (!row) {
      return res.status(404).json({ message: 'Credencial não encontrada ou não disponível publicamente.' });
    }
    return res.json(row);
  } catch (err) {
    console.error('Erro ao verificar credencial:', err.message);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

module.exports = { definirBadgePublico, pesquisarConsultores, getConsultorPublico, getVerificacao };
