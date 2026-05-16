const { sequelize } = require('../config/database');
const CandidaturaBadge = require('../models/CandidaturaBadge');
const EvidenciaCandidatura = require('../models/EvidenciaCandidatura');
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
    `SELECT DISTINCT ur.idutilizador, u.nome, u.email
     FROM utilizador_roles ur
     JOIN utilizadores u ON u.idutilizador = ur.idutilizador
     WHERE ur.idrole = 2`
  );
  return rows;
}

async function getSLsParaBadge(idbadge) {
  const [rows] = await sequelize.query(
    `SELECT DISTINCT u.idutilizador, u.nome, u.email
     FROM badges b
     JOIN niveis n ON n.idnivel = b.idnivel
     JOIN areas a ON a.idarea = n.idarea
     JOIN utilizadores u ON u.idserviceline = a.idserviceline
     JOIN utilizador_roles ur ON ur.idutilizador = u.idutilizador
     WHERE b.idbadge = :idbadge AND ur.idrole = 3`,
    { replacements: { idbadge } }
  );
  return rows;
}

async function getEvidencias(idcandidatura) {
  const [rows] = await sequelize.query(
    `SELECT * FROM evidencias_candidatura WHERE idcandidatura = :idcandidatura ORDER BY datacriacao`,
    { replacements: { idcandidatura } }
  );
  return rows;
}

// ── POST /api/candidaturas ─────────────────────────────────────────────────────
// Consultor submete candidatura
const criarCandidatura = async (req, res) => {
  const { idbadge, idutilizador } = req.body;
  if (!idbadge || !idutilizador) return res.status(400).json({ message: 'idbadge e idutilizador são obrigatórios.' });

  try {
    // Bloqueia se já existe candidatura em processamento (submitted ou em_validacao)
    const [emProcesso] = await sequelize.query(
      `SELECT idcandidatura FROM candidaturas_badges
       WHERE idutilizador = :idutilizador AND idbadge = :idbadge
       AND estado IN ('submitted', 'em_validacao')
       LIMIT 1`,
      { replacements: { idutilizador, idbadge } }
    );
    if (emProcesso.length > 0) {
      return res.status(409).json({ message: 'Já tens uma candidatura em processamento para este badge.' });
    }

    // Se existe candidatura em 'open' (devolvida), reutiliza-a em vez de criar nova
    const [aberta] = await sequelize.query(
      `SELECT idcandidatura FROM candidaturas_badges
       WHERE idutilizador = :idutilizador AND idbadge = :idbadge
       AND estado = 'open'
       LIMIT 1`,
      { replacements: { idutilizador, idbadge } }
    );

    let candidatura;
    if (aberta.length > 0) {
      const id = aberta[0].idcandidatura;
      await sequelize.query(
        `UPDATE candidaturas_badges SET estado = 'submitted', comentario = NULL, dataatualizacao = NOW()
         WHERE idcandidatura = :id`,
        { replacements: { id } }
      );
      // Remove evidências antigas e substitui pelas novas
      await sequelize.query(
        `DELETE FROM evidencias_candidatura WHERE idcandidatura = :id`,
        { replacements: { id } }
      );
      candidatura = { idcandidatura: id };
    } else {
      candidatura = await CandidaturaBadge.create({ idutilizador, idbadge, estado: 'submitted' });
    }

    // Guardar evidências enviadas
    const files = req.files || [];
    for (const file of files) {
      await EvidenciaCandidatura.create({
        idcandidatura: candidatura.idcandidatura,
        fileurl: file.path,
        filename: file.originalname,
      });
    }

    // Buscar info do badge e consultor
    const [[badge]] = await sequelize.query(
      `SELECT nome FROM badges WHERE idbadge = :idbadge`, { replacements: { idbadge } }
    );
    const [[consultor]] = await sequelize.query(
      `SELECT nome, email FROM utilizadores WHERE idutilizador = :idutilizador`, { replacements: { idutilizador } }
    );

    // Notificar todos os TMs
    const tms = await getTMsIds();
    for (const tm of tms) {
      await criarNotificacao(
        tm.idutilizador,
        'Nova candidatura a validar',
        `${consultor.nome} candidatou-se ao badge "${badge?.nome}". Valide as evidências.`
      );
    }

    // Email de confirmação ao consultor
    try {
      await enviarEmailCandidaturaConfirmada(consultor.email, consultor.nome, badge?.nome);
    } catch (_) {}

    return res.status(201).json({ idcandidatura: candidatura.idcandidatura, message: 'Candidatura submetida com sucesso.' });
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
      `SELECT c.*,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem, b.pontos AS badge_pontos,
              tm.nome AS tm_nome,
              sl.nome AS sl_nome
       FROM candidaturas_badges c
       JOIN badges b ON b.idbadge = c.idbadge
       LEFT JOIN utilizadores tm ON tm.idutilizador = c.idtm
       LEFT JOIN utilizadores sl ON sl.idutilizador = c.idsl
       WHERE c.idutilizador = :idutilizador
       ORDER BY c.datacriacao DESC`,
      { replacements: { idutilizador } }
    );

    // Juntar evidências
    for (const row of rows) {
      row.evidencias = await getEvidencias(row.idcandidatura);
    }

    return res.json(rows);
  } catch (err) {
    console.error('Erro ao listar candidaturas:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/candidaturas/tm ──────────────────────────────────────────────────
// TM vê todas as candidaturas submetidas
const listarCandidaturasTM = async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT c.*,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem,
              u.nome AS consultor_nome, u.email AS consultor_email,
              sl_n.nome AS serviceline_nome, a.nome AS area_nome, n.nome AS nivel_nome
       FROM candidaturas_badges c
       JOIN badges b ON b.idbadge = c.idbadge
       JOIN utilizadores u ON u.idutilizador = c.idutilizador
       LEFT JOIN niveis n ON n.idnivel = b.idnivel
       LEFT JOIN areas a ON a.idarea = n.idarea
       LEFT JOIN servicelines sl_n ON sl_n.idserviceline = a.idserviceline
       WHERE c.estado IN ('submitted', 'em_validacao', 'fechado')
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
// TM decide: 'validar' (→ em_validacao) ou 'devolver' (→ open)
const validarTM = async (req, res) => {
  const { id } = req.params;
  const { acao, comentario, idtm } = req.body;

  if (!['validar', 'devolver'].includes(acao)) {
    return res.status(400).json({ message: 'acao deve ser "validar" ou "devolver".' });
  }

  try {
    const candidatura = await CandidaturaBadge.findByPk(id);
    if (!candidatura) return res.status(404).json({ message: 'Candidatura não encontrada.' });
    if (candidatura.estado !== 'submitted') {
      return res.status(400).json({ message: 'Candidatura não está em estado "submitted".' });
    }

    const [[badge]] = await sequelize.query(
      `SELECT nome FROM badges WHERE idbadge = :idbadge`, { replacements: { idbadge: candidatura.idbadge } }
    );
    const [[consultor]] = await sequelize.query(
      `SELECT nome, email FROM utilizadores WHERE idutilizador = :id`, { replacements: { id: candidatura.idutilizador } }
    );

    if (acao === 'validar') {
      await candidatura.update({ estado: 'em_validacao', idtm: idtm || null, comentario: comentario || null, dataatualizacao: new Date() });

      // Notificar SLs da service line do badge
      const sls = await getSLsParaBadge(candidatura.idbadge);
      for (const sl of sls) {
        await criarNotificacao(
          sl.idutilizador,
          'Candidatura para validação final',
          `${consultor.nome} candidatou-se ao badge "${badge?.nome}". Aguarda a sua validação final.`
        );
      }
    } else {
      // devolver
      await candidatura.update({ estado: 'open', idtm: idtm || null, comentario: comentario || null, dataatualizacao: new Date() });

      // Notificar consultor
      await criarNotificacao(
        candidatura.idutilizador,
        'Candidatura devolvida',
        `A sua candidatura ao badge "${badge?.nome}" foi devolvida pelo Talent Manager.${comentario ? ` Motivo: ${comentario}` : ''}`
      );
      try {
        await enviarEmailCandidaturaDevolvida(consultor.email, consultor.nome, badge?.nome, comentario);
      } catch (_) {}
    }

    return res.json({ message: 'Candidatura atualizada.' });
  } catch (err) {
    console.error('Erro ao validar TM:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// ── GET /api/candidaturas/sl?idserviceline=X ─────────────────────────────────
// SL vê candidaturas em_validacao da sua service line
const listarCandidaturasSL = async (req, res) => {
  const { idserviceline } = req.query;
  if (!idserviceline) return res.status(400).json({ message: 'idserviceline obrigatório.' });

  try {
    const [rows] = await sequelize.query(
      `SELECT c.*,
              b.nome AS badge_nome, b.imagemurl AS badge_imagem,
              u.nome AS consultor_nome, u.email AS consultor_email,
              tm.nome AS tm_nome,
              a.nome AS area_nome, n.nome AS nivel_nome
       FROM candidaturas_badges c
       JOIN badges b ON b.idbadge = c.idbadge
       JOIN utilizadores u ON u.idutilizador = c.idutilizador
       LEFT JOIN utilizadores tm ON tm.idutilizador = c.idtm
       JOIN niveis n ON n.idnivel = b.idnivel
       JOIN areas a ON a.idarea = n.idarea
       WHERE c.estado IN ('em_validacao', 'fechado')
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
// SL decide: 'aprovar' | 'rejeitar' | 'sendback'
const validarSL = async (req, res) => {
  const { id } = req.params;
  const { acao, comentario, idsl } = req.body;

  if (!['aprovar', 'rejeitar', 'sendback'].includes(acao)) {
    return res.status(400).json({ message: 'acao deve ser "aprovar", "rejeitar" ou "sendback".' });
  }

  try {
    const candidatura = await CandidaturaBadge.findByPk(id);
    if (!candidatura) return res.status(404).json({ message: 'Candidatura não encontrada.' });
    if (candidatura.estado !== 'em_validacao') {
      return res.status(400).json({ message: 'Candidatura não está em estado "em_validacao".' });
    }

    const [[badge]] = await sequelize.query(
      `SELECT nome FROM badges WHERE idbadge = :idbadge`, { replacements: { idbadge: candidatura.idbadge } }
    );
    const [[consultor]] = await sequelize.query(
      `SELECT nome, email FROM utilizadores WHERE idutilizador = :id`, { replacements: { id: candidatura.idutilizador } }
    );

    if (acao === 'aprovar') {
      await candidatura.update({ estado: 'fechado', resultado: 'aprovado', idsl: idsl || null, comentario: comentario || null, dataatualizacao: new Date() });

      // Atribuir badge ao consultor
      await sequelize.query(
        `INSERT INTO utilizador_badges (idutilizador, idbadge, dataconquista)
         VALUES (:idutilizador, :idbadge, NOW())
         ON CONFLICT DO NOTHING`,
        { replacements: { idutilizador: candidatura.idutilizador, idbadge: candidatura.idbadge } }
      );

      await criarNotificacao(
        candidatura.idutilizador,
        'Badge aprovado!',
        `Parabéns! A sua candidatura ao badge "${badge?.nome}" foi aprovada!`
      );
      try {
        await enviarEmailCandidaturaAprovada(consultor.email, consultor.nome, badge?.nome);
      } catch (_) {}

    } else if (acao === 'rejeitar') {
      await candidatura.update({ estado: 'fechado', resultado: 'rejeitado', idsl: idsl || null, comentario: comentario || null, dataatualizacao: new Date() });

      await criarNotificacao(
        candidatura.idutilizador,
        'Candidatura rejeitada',
        `A sua candidatura ao badge "${badge?.nome}" foi rejeitada.${comentario ? ` Motivo: ${comentario}` : ''}`
      );
      try {
        await enviarEmailCandidaturaRejeitada(consultor.email, consultor.nome, badge?.nome, comentario);
      } catch (_) {}

    } else {
      // sendback
      await candidatura.update({ estado: 'open', idsl: idsl || null, comentario: comentario || null, dataatualizacao: new Date() });

      await criarNotificacao(
        candidatura.idutilizador,
        'Candidatura devolvida — informação adicional',
        `A sua candidatura ao badge "${badge?.nome}" foi devolvida para revisão.${comentario ? ` Comentário: ${comentario}` : ''}`
      );
      try {
        await enviarEmailCandidaturaSendBack(consultor.email, consultor.nome, badge?.nome, comentario);
      } catch (_) {}
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
      `SELECT c.*, b.nome AS badge_nome FROM candidaturas_badges c
       JOIN badges b ON b.idbadge = c.idbadge WHERE c.idcandidatura = :id`,
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
// Retorna o estado da candidatura activa do consultor para um badge específico
const estadoCandidatura = async (req, res) => {
  const { idutilizador, idbadge } = req.query;
  try {
    const [rows] = await sequelize.query(
      `SELECT idcandidatura, estado, resultado, comentario, datacriacao
       FROM candidaturas_badges
       WHERE idutilizador = :idutilizador AND idbadge = :idbadge
       ORDER BY datacriacao DESC LIMIT 1`,
      { replacements: { idutilizador, idbadge } }
    );
    return res.json(rows[0] || null);
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno.' });
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
