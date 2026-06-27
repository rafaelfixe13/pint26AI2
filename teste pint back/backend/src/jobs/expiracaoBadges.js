const { sequelize } = require('../config/database');
const Notificacao = require('../models/Notificacao');
const { enviarEmailBadgeAExpirar, enviarEmailLembrete } = require('../config/email');

// Quantos dias antes da expiração se começa a avisar
const DIAS_AVISO = 30;
// Expiração de badges: verificação diária (granularidade de dias)
const INTERVALO_EXPIRACAO_MS = 24 * 60 * 60 * 1000;
// Lembretes: rede de segurança a cada minuto (o disparo principal é por temporizador preciso)
const INTERVALO_LEMBRETES_MS = 60 * 1000;
// Limite máximo do setTimeout (~24.8 dias)
const MAX_TIMEOUT_MS = 2147483647;

// Verifica badges conquistados que estão a expirar e avisa o utilizador
// (notificação na app + email). Só avisa quem TEM o badge (está inscrito/conquistou).
async function verificarExpiracoes() {
  try {
    // Fonte de badges conquistados: candidaturas aprovadas (estado = 'APPROVED').
    const aExpirar = await sequelize.query(`
      SELECT
        cb.user_id AS idutilizador,
        cb.badge_id AS idbadge,
        u.nome,
        u.email,
        b.nome AS badge_nome,
        (COALESCE(cb.dataaprovacao, cb.datacriacao) + (b.expiremeses || ' months')::interval) AS data_expiracao,
        DATE_PART('day', (COALESCE(cb.dataaprovacao, cb.datacriacao) + (b.expiremeses || ' months')::interval) - NOW()) AS dias_restantes
      FROM candidaturasbadge cb
      JOIN badges b        ON b.idbadge = cb.badge_id
      JOIN utilizadores u  ON u.idutilizador = cb.user_id
      WHERE UPPER(cb.estado) = 'APPROVED'
        AND b.expiremeses IS NOT NULL
        AND b.ativo = true
        AND (COALESCE(cb.dataaprovacao, cb.datacriacao) + (b.expiremeses || ' months')::interval)
              BETWEEN NOW() AND NOW() + (:dias || ' days')::interval
    `, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { dias: DIAS_AVISO },
    });

    for (const row of aExpirar) {
      const dias = Math.max(0, Math.ceil(Number(row.dias_restantes)));
      const titulo = `Badge a expirar: ${row.badge_nome}`;

      // Evita avisar repetidamente: só envia se não houve já um aviso
      // de expiração para este badge nos últimos DIAS_AVISO dias.
      const [jaAvisado] = await sequelize.query(`
        SELECT 1 FROM notificacoes
        WHERE idutilizador = :idutilizador
          AND tipo = 'expiracao'
          AND titulo = :titulo
          AND dataenvio > NOW() - (:dias || ' days')::interval
        LIMIT 1
      `, {
        type: sequelize.QueryTypes.SELECT,
        replacements: { idutilizador: row.idutilizador, titulo, dias: DIAS_AVISO },
      });
      if (jaAvisado) continue;

      const mensagem = `O seu badge "${row.badge_nome}" expira em ${dias} dia(s). Renove a certificação para a manter ativa.`;

      await Notificacao.create({
        idutilizador: row.idutilizador,
        titulo,
        mensagem,
        tipo: 'expiracao',
      });

      try {
        await enviarEmailBadgeAExpirar(row.email, row.nome, row.badge_nome, row.data_expiracao, dias);
      } catch (e) {
        console.error(`Falha ao enviar email de expiração para ${row.email}:`, e.message);
      }
    }

  } catch (err) {
    console.error('Erro na verificação de expiração de badges:', err.message);
  }
}

// Cria notificação + email para um lembrete, com deduplicação.
async function avisarLembrete(row) {
  const dias = Math.ceil(Number(row.dias_restantes));
  const titulo = `Lembrete: ${row.titulo}`;

  const [jaAvisado] = await sequelize.query(`
    SELECT 1 FROM notificacoes
    WHERE idutilizador = :idutilizador
      AND tipo = 'lembrete'
      AND titulo = :titulo
      AND dataenvio > NOW() - (:dias || ' days')::interval
    LIMIT 1
  `, {
    type: sequelize.QueryTypes.SELECT,
    replacements: { idutilizador: row.utilizador_id, titulo, dias: DIAS_AVISO },
  });
  if (jaAvisado) return;

  const mensagem = dias < 0
    ? `O seu lembrete "${row.titulo}" está em atraso.`
    : `O seu lembrete "${row.titulo}" chegou ao prazo.`;

  await Notificacao.create({
    idutilizador: row.utilizador_id,
    titulo,
    mensagem,
    tipo: 'lembrete',
  });

  try {
    await enviarEmailLembrete(row.email, row.nome, row.titulo, row.descricao, row.prazo, dias, row.badge_nome);
  } catch (e) {
    console.error(`Falha ao enviar email de lembrete para ${row.email}:`, e.message);
  }
}

// SELECT comum: lembretes não concluídos cujo prazo já chegou (dispara no momento do prazo).
const SQL_LEMBRETES = `
  SELECT
    l.id, l.utilizador_id, l.titulo, l.descricao, l.badge_nome, l.prazo,
    u.nome, u.email,
    (l.prazo::date - CURRENT_DATE) AS dias_restantes
  FROM lembretes l
  JOIN utilizadores u ON u.idutilizador = l.utilizador_id
  WHERE l.concluido = false
    AND l.prazo <= NOW()
`;

// Verifica todos os lembretes cujo prazo chegou (usado pelo job periódico).
async function verificarLembretes() {
  try {
    const aAvisar = await sequelize.query(SQL_LEMBRETES, {
      type: sequelize.QueryTypes.SELECT,
    });
    for (const row of aAvisar) {
      await avisarLembrete(row);
    }
  } catch (err) {
    console.error('Erro na verificação de lembretes:', err.message);
  }
}

// Verifica um único lembrete (já vencido) e avisa.
async function verificarLembrete(id) {
  try {
    const [row] = await sequelize.query(`${SQL_LEMBRETES} AND l.id = :id`, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { id },
    });
    if (row) await avisarLembrete(row);
  } catch (err) {
    console.error('Erro na verificação do lembrete:', err.message);
  }
}

// Agenda o aviso para o momento EXATO do prazo. Se já passou, avisa já;
// se estiver muito longe (> ~24 dias), fica para a rede de segurança periódica.
function agendarLembrete(id, prazo) {
  const delay = new Date(prazo).getTime() - Date.now();
  if (delay <= 0) { verificarLembrete(id); return; }
  if (delay > MAX_TIMEOUT_MS) return;
  setTimeout(() => verificarLembrete(id), delay);
}

// No arranque, agenda temporizadores precisos para os lembretes futuros pendentes.
async function agendarLembretesPendentes() {
  try {
    const futuros = await sequelize.query(`
      SELECT id, prazo FROM lembretes
      WHERE concluido = false AND prazo > NOW()
    `, { type: sequelize.QueryTypes.SELECT });
    futuros.forEach((l) => agendarLembrete(l.id, l.prazo));
  } catch (err) {
    console.error('Erro ao agendar lembretes pendentes:', err.message);
  }
}

// Arranca os jobs: correm uma vez no arranque e depois nos respetivos intervalos.
function iniciarJobExpiracao() {
  verificarExpiracoes();
  verificarLembretes();
  agendarLembretesPendentes();
  setInterval(verificarExpiracoes, INTERVALO_EXPIRACAO_MS);   // expiração de badges: diário
  setInterval(verificarLembretes, INTERVALO_LEMBRETES_MS);    // lembretes: rede de segurança a cada minuto
}

module.exports = { verificarExpiracoes, verificarLembretes, verificarLembrete, agendarLembrete, iniciarJobExpiracao };
