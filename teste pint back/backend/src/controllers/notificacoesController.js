const Notificacao = require("../models/Notificacao");
const { sequelize } = require("../config/database");

const ROLES_COM_PERFIL = {
  1: [1, 5, 6, 7, 8], // Consultor
  2: [2, 5, 7],       // Talent Manager
  3: [3, 5, 6],       // Service Line
  4: [4, 5, 8],       // Admin
};

// Cria/envia notificacoes
const criarNotificacao = async (req, res) => {
  const { idutilizador, idrole, paraTodos, titulo, mensagem, tipo } = req.body;

  if (!titulo || !mensagem) {
    return res.status(400).json({ message: "Título e mensagem são obrigatórios." });
  }

  try {
    // Envio individual
    if (idutilizador) {
      const nova = await Notificacao.create({
        idutilizador, titulo, mensagem, tipo: tipo || "geral",
      });
      return res.status(201).json({ message: "Notificação enviada.", total: 1, notificacao: nova });
    }

    if (!paraTodos && !idrole) {
      return res.status(400).json({ message: "Indique um destinatário (utilizador, perfil ou todos)." });
    }

    //enviar por perfil ou para todos
    let where = "";
    const replacements = {};
    if (idrole) {
      const roles = ROLES_COM_PERFIL[idrole] || [idrole];
      where = "WHERE idrole IN (:roles)";
      replacements.roles = roles;
    }
    const utilizadores = await sequelize.query(
      `SELECT idutilizador FROM utilizadores ${where}`,
      { type: sequelize.QueryTypes.SELECT, replacements }
    );

    if (utilizadores.length === 0) {
      return res.status(404).json({ message: "Não há utilizadores para o destinatário selecionado." });
    }

    const registos = utilizadores.map((u) => ({
      idutilizador: u.idutilizador,
      titulo,
      mensagem,
      tipo: tipo || "aviso",
    }));
    await Notificacao.bulkCreate(registos);

    return res.status(201).json({
      message: `Notificação enviada a ${registos.length} utilizador(es).`,
      total: registos.length,
    });
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