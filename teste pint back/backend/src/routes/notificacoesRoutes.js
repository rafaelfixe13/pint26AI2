// src/routes/notificacoesRoutes.js
const express = require("express");
const router = express.Router();
const {
  listarNotificacoesPorUtilizador,
  marcarComoLida,
  eliminarNotificacao,
} = require("../controllers/notificacoesController");

// GET /api/notificacoes/utilizador/9
router.get("/utilizador/:id", listarNotificacoesPorUtilizador);

// PATCH /api/notificacoes/123/lida
router.patch("/:id/lida", marcarComoLida);

// DELETE /api/notificacoes/123
router.delete("/:id", eliminarNotificacao);

module.exports = router;