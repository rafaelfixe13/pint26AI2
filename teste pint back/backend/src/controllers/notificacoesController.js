const Notificacao = require("../models/Notificacao");

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
  listarNotificacoesPorUtilizador,
  marcarComoLida,
  eliminarNotificacao,
};