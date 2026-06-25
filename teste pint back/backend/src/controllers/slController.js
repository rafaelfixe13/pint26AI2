const { sequelize } = require('../config/database');

// ── GET /api/sl/dashboard?idserviceline=X ─────────────────────────────────────
// Devolve KPIs, distribuição por área, badges mais obtidos, top consultores e
// atividade recente — tudo restrito à Service Line indicada.
const dashboardSL = async (req, res) => {
  const { idserviceline } = req.query;
  if (!idserviceline) return res.status(400).json({ message: 'idserviceline obrigatório.' });

  try {
    const repl = { sl: idserviceline };

    // Service Line
    const [serviceline] = await sequelize.query(
      `SELECT idserviceline, nome FROM serviceline WHERE idserviceline = :sl`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // KPIs de consultores / catálogo.
    // Os consultores ligam-se à Service Line pela sua ÁREA (idarea → area.idserviceline),
    // já que o campo u.idserviceline não é preenchido para o perfil de consultor.
    const [consultores] = await sequelize.query(
      `SELECT COUNT(*)::int AS total, COALESCE(SUM(u.pontos), 0)::int AS pontos
       FROM utilizadores u
       JOIN areas ar ON ar.idarea = u.idarea
       WHERE u.idrole = 1 AND ar.idserviceline = :sl`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    const [catalogo] = await sequelize.query(
      `SELECT COUNT(*)::int AS total
       FROM badges b
       JOIN areas a ON a.idarea = b.idarea
       WHERE a.idserviceline = :sl`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // KPIs de candidaturas (por estado) dentro da Service Line
    const [candKpis] = await sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE UPPER(c.estado) = 'APPROVED')::int                                AS atribuidos,
         COUNT(*) FILTER (WHERE UPPER(c.estado) = 'UNDER_REVIEW')::int                            AS aguardam,
         COUNT(*) FILTER (WHERE UPPER(c.estado) IN ('SUBMITTED','UNDER_REVIEW','OPEN'))::int      AS emprocesso,
         COUNT(*) FILTER (WHERE UPPER(c.estado) = 'REJECTED')::int                                AS rejeitados,
         COUNT(*)::int                                                                            AS total
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       JOIN areas a  ON a.idarea  = b.idarea
       WHERE a.idserviceline = :sl`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    const decididas = (candKpis.atribuidos || 0) + (candKpis.rejeitados || 0);
    const taxaAprovacao = decididas > 0 ? Math.round((candKpis.atribuidos / decididas) * 100) : null;

    // Badges mais obtidos na Service Line
    const topBadges = await sequelize.query(
      `SELECT b.idbadge, b.nome, b.imagemurl, COUNT(*)::int AS total
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       JOIN areas a  ON a.idarea  = b.idarea
       WHERE a.idserviceline = :sl AND UPPER(c.estado) = 'APPROVED'
       GROUP BY b.idbadge, b.nome, b.imagemurl
       ORDER BY total DESC, b.nome
       LIMIT 5`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // Distribuição por área (atribuídos vs. em processo)
    const porArea = await sequelize.query(
      `SELECT a.nome AS area,
              COUNT(c.idcandidatura) FILTER (WHERE UPPER(c.estado) = 'APPROVED')::int                           AS atribuidos,
              COUNT(c.idcandidatura) FILTER (WHERE UPPER(c.estado) IN ('SUBMITTED','UNDER_REVIEW','OPEN'))::int  AS emprocesso
       FROM areas a
       LEFT JOIN badges b           ON b.idarea = a.idarea
       LEFT JOIN candidaturasbadge c ON c.badge_id = b.idbadge
       WHERE a.idserviceline = :sl
       GROUP BY a.idarea, a.nome
       ORDER BY a.nome`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // Top consultores da Service Line
    const topConsultores = await sequelize.query(
      `SELECT u.idutilizador, u.nome, u.fotourl, ar.nome AS area,
              COALESCE(u.pontos, 0)::int AS pontos,
              (SELECT COUNT(*) FROM candidaturasbadge c
               JOIN badges b ON b.idbadge = c.badge_id
               WHERE c.user_id = u.idutilizador AND UPPER(c.estado) = 'APPROVED')::int AS badges
       FROM utilizadores u
       JOIN areas ar ON ar.idarea = u.idarea
       WHERE u.idrole = 1 AND ar.idserviceline = :sl
       ORDER BY u.pontos DESC NULLS LAST, u.nome
       LIMIT 5`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    // Atividade recente (obtidos + em processo) — cobre o "histórico"
    const atividade = await sequelize.query(
      `SELECT c.idcandidatura, c.estado, c.datacriacao, c.datasubmissao,
              c.dataaprovacao, c.datarejeicao, c.ultimaatualizacao,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem,
              u.nome AS consultor_nome, a.nome AS area_nome
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       JOIN areas a  ON a.idarea  = b.idarea
       JOIN utilizadores u ON u.idutilizador = c.user_id
       WHERE a.idserviceline = :sl
       ORDER BY COALESCE(c.ultimaatualizacao, c.datacriacao) DESC
       LIMIT 8`,
      { replacements: repl, type: sequelize.QueryTypes.SELECT }
    );

    return res.json({
      serviceline: serviceline || null,
      kpis: {
        consultores: consultores.total,
        totalPontos: consultores.pontos,
        badgesCatalogo: catalogo.total,
        badgesAtribuidos: candKpis.atribuidos,
        aguardamValidacao: candKpis.aguardam,
        emProcesso: candKpis.emprocesso,
        rejeitados: candKpis.rejeitados,
        taxaAprovacao,
      },
      topBadges,
      porArea,
      topConsultores,
      atividade,
    });
  } catch (err) {
    console.error('Erro no dashboard SL:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/sl/conquistas?idserviceline=X ────────────────────────────────────
// Agrega, por consultor da Service Line, os dados necessários para calcular as
// conquistas especiais (Premium): nº de badges aprovados, pontos acumulados e as
// datas de aprovação (para as regras com janela temporal). Tudo só-leitura.
const conquistasSL = async (req, res) => {
  const { idserviceline } = req.query;
  if (!idserviceline) return res.status(400).json({ message: 'idserviceline obrigatório.' });

  try {
    const consultores = await sequelize.query(
      `SELECT u.idutilizador, u.nome, u.email, u.fotourl, ar.nome AS area,
              COALESCE(u.pontos, 0)::int AS totalpontos,
              COUNT(c.idcandidatura) FILTER (WHERE UPPER(c.estado) = 'APPROVED')::int AS totalbadges,
              COALESCE(
                array_agg(COALESCE(c.dataaprovacao, c.ultimaatualizacao))
                  FILTER (WHERE UPPER(c.estado) = 'APPROVED'),
                '{}'
              ) AS datasaprovacao
       FROM utilizadores u
       JOIN areas ar ON ar.idarea = u.idarea
       LEFT JOIN candidaturasbadge c ON c.user_id = u.idutilizador
       WHERE u.idrole = 1 AND ar.idserviceline = :sl
       GROUP BY u.idutilizador, u.nome, u.fotourl, ar.nome, u.pontos
       ORDER BY u.pontos DESC NULLS LAST, u.nome`,
      { replacements: { sl: idserviceline }, type: sequelize.QueryTypes.SELECT }
    );

    return res.json(consultores);
  } catch (err) {
    console.error('Erro nas conquistas SL:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

module.exports = { dashboardSL, conquistasSL };
