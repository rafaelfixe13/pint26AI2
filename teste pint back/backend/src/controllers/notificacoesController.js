const Notificacao = require("../models/Notificacao");
const { sequelize } = require("../config/database");
const { enviarEmailNotificacao } = require("../config/email");

// Um perfil base (1=Consultor, 2=TM, 3=SL, 4=Admin) pode estar em vários idrole
// compostos. Mapeia cada perfil base para todos os idrole que o incluem.
const ROLES_COM_PERFIL = {
  1: [1, 5, 6, 7, 8], // Consultor
  2: [2, 5, 7],       // Talent Manager
  3: [3, 5, 6],       // Service Line
  4: [4, 5, 8],       // Administrador
};

// Cria/envia notificações usando a tabela existente.
// Destinatário: { idutilizador } (um só) | { idrole } (todos de um perfil) | { paraTodos: true } (broadcast).
// Canal: 'app' (in-app, omissão) | 'email' | 'ambos'.
const criarNotificacao = async (req, res) => {
  const { idutilizador, idrole, paraTodos, titulo, mensagem, tipo, canal } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ message: "Título e mensagem são obrigatórios." });
  }

  const canalFinal = ["app", "email", "ambos"].includes(canal) ? canal : "app";
  const querApp = canalFinal === "app" || canalFinal === "ambos";
  const querEmail = canalFinal === "email" || canalFinal === "ambos";

  try {
    // Resolve os destinatários (com email, para o canal de email)
    let destinatarios = [];
    if (idutilizador) {
      destinatarios = await sequelize.query(
        "SELECT idutilizador, email FROM utilizadores WHERE idutilizador = :id",
        { type: sequelize.QueryTypes.SELECT, replacements: { id: idutilizador } }
      );
    } else if (paraTodos || idrole) {
      let where = "";
      const replacements = {};
      if (idrole) {
        const roles = ROLES_COM_PERFIL[idrole] || [idrole];
        where = "WHERE idrole IN (:roles)";
        replacements.roles = roles;
      }
      destinatarios = await sequelize.query(
        `SELECT idutilizador, email FROM utilizadores ${where}`,
        { type: sequelize.QueryTypes.SELECT, replacements }
      );
    } else {
      return res.status(400).json({ message: "Indique um destinatário (utilizador, perfil ou todos)." });
    }

    if (destinatarios.length === 0) {
      return res.status(404).json({ message: "Não há utilizadores para o destinatário selecionado." });
    }

    // Canal in-app: cria os registos de notificação
    if (querApp) {
      const registos = destinatarios.map((u) => ({
        idutilizador: u.idutilizador,
        titulo,
        mensagem,
        tipo: tipo || "aviso",
      }));
      await Notificacao.bulkCreate(registos);
    }

    // Canal email: envia email a cada destinatário (falhas não bloqueiam)
    let emailsEnviados = 0;
    if (querEmail) {
      for (const u of destinatarios) {
        if (!u.email) continue;
        try {
          await enviarEmailNotificacao(u.email, titulo, mensagem);
          emailsEnviados++;
        } catch (e) {
          console.error("Falha ao enviar email de notificação:", e.message);
        }
      }
    }

    const total = destinatarios.length;
    let message;
    if (canalFinal === "app") message = `Notificação enviada a ${total} utilizador(es).`;
    else if (canalFinal === "email") message = `Email enviado a ${emailsEnviados} de ${total} utilizador(es).`;
    else message = `Notificação enviada a ${total} utilizador(es); email a ${emailsEnviados}.`;

    return res.status(201).json({ message, total, emailsEnviados });
  } catch (err) {
    console.error("Erro ao criar notificação:", err);
    return res.status(500).json({ message: "Erro ao criar notificação." });
  }
};

const listarNotificacoesPorUtilizador = async (req, res) => {
  const { id } = req.params; // idutilizador
  try {
    const notificacoes = await Notificacao.findAll({
      where: { idutilizador: id },
      order: [["dataenvio", "DESC"]],
    });
    return res.json(notificacoes);
  } catch (err) {
    console.error("Erro ao listar notificações:", err);
    return res.status(500).json({ message: "Erro ao listar notificações" });
  }
};

const marcarComoLida = async (req, res) => {
  const { id } = req.params; // idnotificacao
  try {
    await Notificacao.update({ lido: true }, { where: { idnotificacao: id } });
    return res.json({ message: "Notificação marcada como lida" });
  } catch (err) {
    console.error("Erro ao marcar notificação como lida:", err);
    return res.status(500).json({ message: "Erro ao marcar notificação como lida" });
  }
};

const eliminarNotificacao = async (req, res) => {
  const { id } = req.params; // idnotificacao
  try {
    await Notificacao.destroy({ where: { idnotificacao: id } });
    return res.json({ message: "Notificação eliminada" });
  } catch (err) {
    console.error("Erro ao eliminar notificação:", err);
    return res.status(500).json({ message: "Erro ao eliminar notificação" });
  }
};

module.exports = {
  criarNotificacao,
  listarNotificacoesPorUtilizador,
  marcarComoLida,
  eliminarNotificacao,
};