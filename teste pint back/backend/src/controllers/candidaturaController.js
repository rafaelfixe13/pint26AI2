const { sequelize } = require('../config/database');
const CandidaturaBadge = require('../models/CandidaturaBadge');
const Notificacao = require('../models/Notificacao');
const {
  enviarEmailCandidaturaConfirmada,
  enviarEmailCandidaturaDevolvida,
  enviarEmailCandidaturaAprovada,
  enviarEmailCandidaturaRejeitada,
  enviarEmailCandidaturaSendBack,
} = require('../config/email');

// ── helpers ───────────────────────────────────────────────────────────────────

async function criarNotificacao(idutilizador, titulo, mensagem, tipo = 'candidatura') {
  await Notificacao.create({ idutilizador, titulo, mensagem, tipo });
}

async function getTMsIds() {
  const [rows] = await sequelize.query(
    `SELECT idutilizador, nome, email
     FROM utilizadores
     WHERE idrole = 2`
  );
  return rows;
}

async function getSLsParaBadge(idbadge) {
  const [rows] = await sequelize.query(
    `SELECT DISTINCT u.idutilizador, u.nome, u.email
     FROM badges b
     JOIN areas a ON a.idarea = b.idarea
     JOIN utilizadores u ON u.idserviceline = a.idserviceline
     WHERE b.idbadge = :idbadge AND u.idrole = 3`,
    { replacements: { idbadge } }
  );
  return rows;
}

async function getEvidencias(idcandidatura) {
  const [rows] = await sequelize.query(
    `SELECT e.idevidencia, e.ficheirourl AS fileurl, e.descricao AS filename, e.dataupload AS datacriacao
     FROM evidencias e
     JOIN candidaturasrequisitos cr ON cr.idcandidaturareq = e.idcandidaturareq
     WHERE cr.idcandidatura = :idcandidatura
     ORDER BY e.dataupload`,
    { replacements: { idcandidatura } }
  );
  return rows;
}

// ── POST /api/candidaturas ────────────────────────────────────────────────────
const criarCandidatura = async (req, res) => {
  const { idbadge, idutilizador, evidencias = [] } = req.body;

  if (!idbadge || !idutilizador)
    return res.status(400).json({ message: 'idbadge e idutilizador são obrigatórios.' });

  try {
    const [emProcesso] = await sequelize.query(
      `SELECT idcandidatura FROM candidaturasbadge
       WHERE user_id = :idutilizador AND badge_id = :idbadge
       AND estado IN ('SUBMITTED', 'UNDER_REVIEW')
       LIMIT 1`,
      { replacements: { idutilizador, idbadge } }
    );
    if (emProcesso.length > 0) {
      return res.status(409).json({ message: 'Já tens uma candidatura em processamento para este badge.' });
    }

    const [aberta] = await sequelize.query(
      `SELECT idcandidatura FROM candidaturasbadge
       WHERE user_id = :idutilizador AND badge_id = :idbadge
       AND estado = 'OPEN'
       LIMIT 1`,
      { replacements: { idutilizador, idbadge } }
    );

    let candidatura;
    if (aberta.length > 0) {
      const id = aberta[0].idcandidatura;
      await sequelize.query(
        `UPDATE candidaturasbadge
         SET estado = 'SUBMITTED', comentariogeral = NULL,
             ultimaatualizacao = NOW(), datasubmissao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id } }
      );
      await sequelize.query(
        `DELETE FROM evidencias
         WHERE idcandidaturareq IN (
           SELECT idcandidaturareq FROM candidaturasrequisitos WHERE idcandidatura = :id
         )`,
        { replacements: { id } }
      );
      await sequelize.query(
        `DELETE FROM candidaturasrequisitos WHERE idcandidatura = :id`,
        { replacements: { id } }
      );
      candidatura = { idcandidatura: id };
    } else {
      const [rows] = await sequelize.query(
        `INSERT INTO candidaturasbadge (user_id, badge_id, estado, datasubmissao, datacriacao)
         VALUES (:idutilizador, :idbadge, 'SUBMITTED', NOW(), NOW())
         RETURNING idcandidatura`,
        { replacements: { idutilizador, idbadge } }
      );
      candidatura = { idcandidatura: rows[0].idcandidatura };
    }

    if (evidencias.length > 0) {
      const [requisitos] = await sequelize.query(
        `SELECT idrequisito FROM requisitos
         WHERE idbadge = :idbadge AND ativo = true
         ORDER BY ordem`,
        { replacements: { idbadge } }
      );

      if (requisitos.length === 0) {
        return res.status(400).json({ message: 'Este badge não tem requisitos definidos. Não é possível submeter evidências.' });
      }

      const [crRows] = await sequelize.query(
        `INSERT INTO candidaturasrequisitos (idcandidatura, idrequisito, cumprido)
         VALUES (:idcandidatura, :idrequisito, false)
         RETURNING idcandidaturareq`,
        {
          replacements: {
            idcandidatura: candidatura.idcandidatura,
            idrequisito: requisitos[0].idrequisito,
          },
        }
      );
      const idcandidaturareq = crRows[0].idcandidaturareq;

      for (const ev of evidencias) {
        const ficheirourl = `data:${ev.mimetype || 'application/octet-stream'};base64,${ev.base64}`;
        await sequelize.query(
          `INSERT INTO evidencias (idcandidaturareq, ficheirourl, descricao, dataupload)
           VALUES (:idcandidaturareq, :ficheirourl, :descricao, NOW())`,
          { replacements: { idcandidaturareq, ficheirourl, descricao: ev.filename } }
        );
      }
    }

    const [[badge]] = await sequelize.query(
      `SELECT nome FROM badges WHERE idbadge = :idbadge`,
      { replacements: { idbadge } }
    );
    const [[consultor]] = await sequelize.query(
      `SELECT nome, email FROM utilizadores WHERE idutilizador = :idutilizador`,
      { replacements: { idutilizador } }
    );

    const tms = await getTMsIds();
    for (const tm of tms) {
      await criarNotificacao(
        tm.idutilizador,
        'Nova candidatura a validar',
        `${consultor.nome} candidatou-se ao badge "${badge?.nome}". Valide as evidências.`
      );
    }
    try { await enviarEmailCandidaturaConfirmada(consultor.email, consultor.nome, badge?.nome); } catch (_) {}

    return res.status(201).json({
      idcandidatura: candidatura.idcandidatura,
      message: 'Candidatura submetida com sucesso.',
    });
  } catch (err) {
    console.error('Erro ao criar candidatura:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/candidaturas/minhas?idutilizador=X ───────────────────────────────
const listarMinhasCandidaturas = async (req, res) => {
  const { idutilizador } = req.query;
  if (!idutilizador) return res.status(400).json({ message: 'idutilizador obrigatório.' });

  try {
    const [rows] = await sequelize.query(
      `SELECT c.idcandidatura, c.user_id AS idutilizador, c.badge_id AS idbadge,
              c.estado, c.comentariogeral AS comentario, c.datacriacao,
              c.dataaprovacao, c.datarejeicao,
              CASE
                WHEN UPPER(c.estado) = 'APPROVED' THEN 'aprovado'
                WHEN UPPER(c.estado) = 'REJECTED' THEN 'rejeitado'
                WHEN c.dataaprovacao IS NOT NULL   THEN 'aprovado'
                WHEN c.datarejeicao  IS NOT NULL   THEN 'rejeitado'
                ELSE NULL
              END AS resultado,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem, b.pontos AS badge_pontos
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       WHERE c.user_id = :idutilizador
       ORDER BY c.datacriacao DESC`,
      { replacements: { idutilizador } }
    );
    for (const row of rows) {
      row.evidencias = await getEvidencias(row.idcandidatura);
    }
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar candidaturas:', err.message);
    return res.status(500).json({ message: 'Erro interno.', error: err.message });
  }
};

// ── GET /api/candidaturas/tm/lista ────────────────────────────────────────────
const listarCandidaturasTM = async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT c.idcandidatura, c.user_id AS idutilizador, c.badge_id AS idbadge,
              c.estado, c.datacriacao, c.ultimaatualizacao,
              c.comentariogeral AS comentario,
              c.dataaprovacao, c.datarejeicao,
              CASE
                WHEN UPPER(c.estado) = 'APPROVED' THEN 'aprovado'
                WHEN UPPER(c.estado) = 'REJECTED' THEN 'rejeitado'
                WHEN c.dataaprovacao IS NOT NULL   THEN 'aprovado'
                WHEN c.datarejeicao  IS NOT NULL   THEN 'rejeitado'
                ELSE NULL
              END AS resultado,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem,
              u.nome AS consultor_nome, u.email AS consultor_email
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       JOIN utilizadores u ON u.idutilizador = c.user_id
       WHERE UPPER(c.estado) IN ('SUBMITTED', 'UNDER_REVIEW', 'OPEN', 'APPROVED', 'REJECTED')
       ORDER BY c.datacriacao DESC`
    );
    for (const row of rows) {
      row.evidencias = await getEvidencias(row.idcandidatura);
    }
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar candidaturas TM:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── PUT /api/candidaturas/:id/tm ──────────────────────────────────────────────
const validarTM = async (req, res) => {
  const { id } = req.params;
  const { acao, comentario, idtm } = req.body;

  if (!['validar', 'devolver'].includes(acao)) {
    return res.status(400).json({ message: 'acao deve ser "validar" ou "devolver".' });
  }

  try {
    const candidatura = await CandidaturaBadge.findByPk(id);
    if (!candidatura) return res.status(404).json({ message: 'Candidatura não encontrada.' });

    if (!['SUBMITTED', 'OPEN'].includes(candidatura.estado.toUpperCase())) {
      return res.status(400).json({ message: 'Candidatura deve estar em estado "SUBMITTED" ou "OPEN".' });
    }

    const [[badge]] = await sequelize.query(
      `SELECT nome FROM badges WHERE idbadge = :idbadge`,
      { replacements: { idbadge: candidatura.badge_id } }
    );
    const [[consultor]] = await sequelize.query(
      `SELECT nome, email FROM utilizadores WHERE idutilizador = :id`,
      { replacements: { id: candidatura.user_id } }
    );

    if (acao === 'validar') {
      await sequelize.query(
        `UPDATE candidaturasbadge
         SET estado = 'UNDER_REVIEW', idrevisoratual = :idtm,
             comentariogeral = :comentario, ultimaatualizacao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id, idtm: idtm || null, comentario: comentario || null } }
      );
      const sls = await getSLsParaBadge(candidatura.badge_id);
      for (const sl of sls) {
        await criarNotificacao(
          sl.idutilizador,
          'Candidatura para validação final',
          `${consultor.nome} candidatou-se ao badge "${badge?.nome}". Aguarda a sua validação final.`
        );
      }
    } else {
      await sequelize.query(
        `UPDATE candidaturasbadge
         SET estado = 'OPEN', idrevisoratual = :idtm,
             comentariogeral = :comentario, ultimaatualizacao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id, idtm: idtm || null, comentario: comentario || null } }
      );
      await criarNotificacao(
        candidatura.user_id,
        'Candidatura devolvida',
        `A sua candidatura ao badge "${badge?.nome}" foi devolvida pelo Talent Manager.${comentario ? ` Motivo: ${comentario}` : ''}`
      );
      try { await enviarEmailCandidaturaDevolvida(consultor.email, consultor.nome, badge?.nome, comentario); } catch (_) {}
    }

    return res.json({ message: 'Candidatura atualizada.' });
  } catch (err) {
    console.error('Erro ao validar TM:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/candidaturas/sl/lista?idserviceline=X ───────────────────────────
const listarCandidaturasSL = async (req, res) => {
  const { idserviceline } = req.query;
  if (!idserviceline) return res.status(400).json({ message: 'idserviceline obrigatório.' });

  try {
    const [rows] = await sequelize.query(
      `SELECT c.idcandidatura, c.user_id AS idutilizador, c.badge_id AS idbadge,
              c.estado, c.datacriacao, c.ultimaatualizacao,
              c.comentariogeral AS comentario,
              c.dataaprovacao, c.datarejeicao,
              CASE
                WHEN UPPER(c.estado) = 'APPROVED' THEN 'aprovado'
                WHEN UPPER(c.estado) = 'REJECTED' THEN 'rejeitado'
                WHEN c.dataaprovacao IS NOT NULL   THEN 'aprovado'
                WHEN c.datarejeicao  IS NOT NULL   THEN 'rejeitado'
                ELSE NULL
              END AS resultado,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem,
              u.nome AS consultor_nome, u.email AS consultor_email,
              rev.nome AS tm_nome,
              a.nome AS area_nome
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       JOIN areas a ON a.idarea = b.idarea
       JOIN utilizadores u ON u.idutilizador = c.user_id
       LEFT JOIN utilizadores rev ON rev.idutilizador = c.idrevisoratual
       WHERE UPPER(c.estado) IN ('UNDER_REVIEW', 'APPROVED', 'REJECTED')
       AND a.idserviceline = :idserviceline
       ORDER BY c.datacriacao DESC`,
      { replacements: { idserviceline } }
    );
    for (const row of rows) {
      row.evidencias = await getEvidencias(row.idcandidatura);
    }
    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar candidaturas SL:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── PUT /api/candidaturas/:id/sl ──────────────────────────────────────────────
const validarSL = async (req, res) => {
  const { id } = req.params;
  const { acao, comentario, idsl } = req.body;

  if (!['aprovar', 'rejeitar', 'sendback'].includes(acao)) {
    return res.status(400).json({ message: 'acao deve ser "aprovar", "rejeitar" ou "sendback".' });
  }

  try {
    const candidatura = await CandidaturaBadge.findByPk(id);
    if (!candidatura) return res.status(404).json({ message: 'Candidatura não encontrada.' });
    if (candidatura.estado.toUpperCase() !== 'UNDER_REVIEW') {
      return res.status(400).json({ message: 'Candidatura não está em estado "UNDER_REVIEW".' });
    }

    const [[badge]] = await sequelize.query(
      `SELECT nome FROM badges WHERE idbadge = :idbadge`,
      { replacements: { idbadge: candidatura.badge_id } }
    );
    const [[consultor]] = await sequelize.query(
      `SELECT nome, email FROM utilizadores WHERE idutilizador = :id`,
      { replacements: { id: candidatura.user_id } }
    );

    if (acao === 'aprovar') {
      await sequelize.query(
        `UPDATE candidaturasbadge
         SET estado = 'APPROVED', dataaprovacao = NOW(), idrevisoratual = :idsl,
             comentariogeral = :comentario, ultimaatualizacao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id, idsl: idsl || null, comentario: comentario || null } }
      );
      await criarNotificacao(
        candidatura.user_id,
        'Badge aprovado!',
        `Parabéns! A sua candidatura ao badge "${badge?.nome}" foi aprovada!`
      );
      try { await enviarEmailCandidaturaAprovada(consultor.email, consultor.nome, badge?.nome); } catch (_) {}

    } else if (acao === 'rejeitar') {
      await sequelize.query(
        `UPDATE candidaturasbadge
         SET estado = 'REJECTED', datarejeicao = NOW(), idrevisoratual = :idsl,
             comentariogeral = :comentario, ultimaatualizacao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id, idsl: idsl || null, comentario: comentario || null } }
      );
      await criarNotificacao(
        candidatura.user_id,
        'Candidatura rejeitada',
        `A sua candidatura ao badge "${badge?.nome}" foi rejeitada.${comentario ? ` Motivo: ${comentario}` : ''}`
      );
      try { await enviarEmailCandidaturaRejeitada(consultor.email, consultor.nome, badge?.nome, comentario); } catch (_) {}

    } else {
      await sequelize.query(
        `UPDATE candidaturasbadge
         SET estado = 'OPEN', idrevisoratual = :idsl,
             comentariogeral = :comentario, ultimaatualizacao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id, idsl: idsl || null, comentario: comentario || null } }
      );
      await criarNotificacao(
        candidatura.user_id,
        'Candidatura devolvida — informação adicional',
        `A sua candidatura ao badge "${badge?.nome}" foi devolvida para revisão.${comentario ? ` Comentário: ${comentario}` : ''}`
      );
      try { await enviarEmailCandidaturaSendBack(consultor.email, consultor.nome, badge?.nome, comentario); } catch (_) {}
    }

    return res.json({ message: 'Candidatura atualizada.' });
  } catch (err) {
    console.error('Erro ao validar SL:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/candidaturas/:id ─────────────────────────────────────────────────
const detalhesCandidatura = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await sequelize.query(
      `SELECT c.idcandidatura, c.user_id AS idutilizador, c.badge_id AS idbadge,
              c.estado, c.datacriacao, c.comentariogeral AS comentario,
              c.dataaprovacao, c.datarejeicao,
              CASE
                WHEN UPPER(c.estado) = 'APPROVED' THEN 'aprovado'
                WHEN UPPER(c.estado) = 'REJECTED' THEN 'rejeitado'
                WHEN c.dataaprovacao IS NOT NULL   THEN 'aprovado'
                WHEN c.datarejeicao  IS NOT NULL   THEN 'rejeitado'
                ELSE NULL
              END AS resultado,
              b.nome AS badge_nome
       FROM candidaturasbadge c
       JOIN badges b ON b.idbadge = c.badge_id
       WHERE c.idcandidatura = :id`,
      { replacements: { id } }
    );
    if (!rows.length) return res.status(404).json({ message: 'Não encontrado.' });
    rows[0].evidencias = await getEvidencias(id);
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/candidaturas/badge-estado?idutilizador=X&idbadge=Y ──────────────
const estadoCandidatura = async (req, res) => {
  const { idutilizador, idbadge } = req.query;
  try {
    const [rows] = await sequelize.query(
      `SELECT idcandidatura, estado, comentariogeral AS comentario, datacriacao,
              dataaprovacao, datarejeicao,
              CASE
                WHEN UPPER(estado) = 'APPROVED' THEN 'aprovado'
                WHEN UPPER(estado) = 'REJECTED' THEN 'rejeitado'
                WHEN dataaprovacao IS NOT NULL   THEN 'aprovado'
                WHEN datarejeicao  IS NOT NULL   THEN 'rejeitado'
                ELSE NULL
              END AS resultado
       FROM candidaturasbadge
       WHERE user_id = :idutilizador AND badge_id = :idbadge
       ORDER BY datacriacao DESC LIMIT 1`,
      { replacements: { idutilizador, idbadge } }
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error('Erro em estadoCandidatura:', err);
    return res.status(500).json({ message: 'Erro interno.', error: err.message });
  }
};

module.exports = {
  criarCandidatura,
  listarMinhasCandidaturas,
  listarCandidaturasTM,
  validarTM,
  listarCandidaturasSL,
  validarSL,
  detalhesCandidatura,
  estadoCandidatura,
};