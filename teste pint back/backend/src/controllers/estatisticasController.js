const { sequelize } = require('../config/database');

const ESTADOS_EM_CURSO = ['OPEN', 'SUBMITTED', 'UNDER_REVIEW'];


const periodoSql = (de, ate) => {
  const cond = [];
  const repl = {};
  if (de) { cond.push('c.dataaprovacao >= :de'); repl.de = `${de} 00:00:00`; }
  if (ate) { cond.push('c.dataaprovacao <= :ate'); repl.ate = `${ate} 23:59:59`; }
  return { extra: cond.length ? ` AND ${cond.join(' AND ')}` : '', repl };
};

const getEstatisticas = async (req, res) => {
  const { de, ate } = req.query;
  const { extra, repl } = periodoSql(de, ate);

  try {
    //estatisticas
    const [totais] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM utilizadores)                                       AS utilizadores,
        (SELECT COUNT(*) FROM badges WHERE ativo = true)                          AS badges_catalogo,
        (SELECT COUNT(*) FROM candidaturasbadge c
           WHERE c.estado = 'APPROVED'${extra})                                   AS badges_atribuidos,
        (SELECT COUNT(*) FROM candidaturasbadge
           WHERE estado IN ('OPEN','SUBMITTED','UNDER_REVIEW'))                    AS pedidos_em_curso
    `, { type: sequelize.QueryTypes.SELECT, replacements: repl });

    //Badges atribuidos por mes
    const badgesPorMes = await sequelize.query(`
      SELECT to_char(date_trunc('month', c.dataaprovacao), 'YYYY-MM') AS mes,
             COUNT(*)::int AS total
      FROM candidaturasbadge c
      WHERE c.estado = 'APPROVED' AND c.dataaprovacao IS NOT NULL${extra}
      GROUP BY 1
      ORDER BY 1
    `, { type: sequelize.QueryTypes.SELECT, replacements: repl });

    //Badges atribuidos por nível
    const badgesPorNivel = await sequelize.query(`
      SELECT COALESCE(n.nome, 'Sem nível') AS nivel, COUNT(*)::int AS total
      FROM candidaturasbadge c
      JOIN badges b      ON b.idbadge = c.badge_id
      LEFT JOIN nivel n  ON n.idnivel = b.idnivel
      WHERE c.estado = 'APPROVED'${extra}
      GROUP BY n.nome
      ORDER BY total DESC
    `, { type: sequelize.QueryTypes.SELECT, replacements: repl });

    //Badges atribuidos por area/service line
    const badgesPorArea = await sequelize.query(`
      SELECT COALESCE(sl.nome, '—') AS serviceline,
             COALESCE(a.nome, '—')  AS area,
             COUNT(*)::int          AS total
      FROM candidaturasbadge c
      JOIN badges b           ON b.idbadge = c.badge_id
      LEFT JOIN areas a       ON a.idarea = b.idarea
      LEFT JOIN serviceline sl ON sl.idserviceline = a.idserviceline
      WHERE c.estado = 'APPROVED'${extra}
      GROUP BY sl.nome, a.nome
      ORDER BY total DESC
    `, { type: sequelize.QueryTypes.SELECT, replacements: repl });

    //Badges por LP
    const [lp] = await sequelize.query(`
      SELECT nome FROM learningpaths WHERE ativo = true ORDER BY idlearningpath LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    const badgesPorLearningPath = [{
      learningpath: lp?.nome || 'Jornada Técnica',
      total: Number(totais.badges_atribuidos) || 0,
    }];

    //Utilizadores registados por mes
    const utilizadoresPorMes = await sequelize.query(`
      SELECT to_char(date_trunc('month', datacriacao), 'YYYY-MM') AS mes,
             COUNT(*)::int AS total
      FROM utilizadores
      WHERE datacriacao IS NOT NULL
      GROUP BY 1
      ORDER BY 1
    `, { type: sequelize.QueryTypes.SELECT });

    return res.json({
      totais: {
        utilizadores: Number(totais.utilizadores) || 0,
        badgesCatalogo: Number(totais.badges_catalogo) || 0,
        badgesAtribuidos: Number(totais.badges_atribuidos) || 0,
        pedidosEmCurso: Number(totais.pedidos_em_curso) || 0,
      },
      badgesPorMes,
      badgesPorNivel,
      badgesPorArea,
      badgesPorLearningPath,
      utilizadoresPorMes,
      periodo: { de: de || null, ate: ate || null },
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = { getEstatisticas, ESTADOS_EM_CURSO };
