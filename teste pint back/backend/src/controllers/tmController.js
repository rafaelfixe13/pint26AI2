const { sequelize } = require('../config/database');

const listarBadgesEspeciais = async (req, res) => {
  try {
    const badges = await sequelize.query(
      `SELECT idbadgeespecial, nome, descricao, pontos
       FROM badgesespeciais
       ORDER BY idbadgeespecial`,
      { type: sequelize.QueryTypes.SELECT }
    );
    return res.json(badges);
  } catch (error) {
    console.error('Erro ao listar badges especiais:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

const listarRanking = async (req, res) => {
  try {
    const ranking = await sequelize.query(`
      SELECT
        u.idutilizador,
        u.nome,
        u.fotourl,
        sl.nome AS serviceline,
        a.nome  AS area,
        COALESCE(u.pontos, 0) AS pontos
      FROM utilizadores u
      LEFT JOIN servicelines sl ON u.idserviceline = sl.idserviceline
      LEFT JOIN areas a         ON u.idarea = a.idarea
      WHERE u.idrole = 1
      ORDER BY u.pontos DESC NULLS LAST
    `, { type: sequelize.QueryTypes.SELECT });

    return res.json(ranking);
  } catch (error) {
    console.error('Erro ao listar ranking:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

const listarConsultores = async (req, res) => {
  try {
    const consultores = await sequelize.query(`
      SELECT
        u.idutilizador,
        u.nome,
        u.fotourl,
        sl.nome AS serviceline,
        a.nome  AS area
      FROM utilizadores u
      LEFT JOIN servicelines sl ON u.idserviceline = sl.idserviceline
      LEFT JOIN areas a         ON u.idarea = a.idarea
      WHERE u.idrole = 1
      ORDER BY u.nome
    `, { type: sequelize.QueryTypes.SELECT });

    return res.json(consultores);
  } catch (error) {
    console.error('Erro detalhado:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listarBadgesEspeciais,
  listarRanking,
  listarConsultores,
};