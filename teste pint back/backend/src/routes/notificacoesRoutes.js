// src/routes/notificacoesRoutes.js
const express = require("express");
const router = express.Router();
const {
  criarNotificacao,
  listarNotificacoesPorUtilizador,
  marcarComoLida,
  eliminarNotificacao,
} = require("../controllers/notificacoesController");


router.post("/", criarNotificacao);

router.get("/utilizador/:id", listarNotificacoesPorUtilizador);

router.patch("/:id/lida", marcarComoLida);

router.delete("/:id", eliminarNotificacao);

module.exports = router;