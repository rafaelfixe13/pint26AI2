const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const Utilizador = require('../models/Utilizador');

const ROLE_CONSULTOR = 1;

const listarUtilizadores = async (req, res) => {
  try {
    const utilizadores = await sequelize.query(`
      SELECT
        u.idutilizador,
        u.nome,
        u.email,
        u.estadoconta,
        u.emailconfirmado,
        u.datacriacao,
        u.idrole,
        json_build_array(
          json_build_object('idrole', u.idrole)
        ) AS roles
      FROM utilizadores u
      ORDER BY u.idutilizador
    `, { type: sequelize.QueryTypes.SELECT });

    return res.json(utilizadores);
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const listarTodasRoles = async (req, res) => {
  try {
    // Como não tens tabela roles, retorna os roles fixos
    const roles = [
      { idrole: 1, nome: 'CONSULTOR' },
      { idrole: 2, nome: 'TALENT_MANAGER' },
      { idrole: 3, nome: 'ADMIN' },
    ];
    return res.json(roles);
  } catch (error) {
    console.error('Erro ao listar roles:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const adicionarRole = async (req, res) => {
  const { idutilizador, idrole } = req.body;

  if (!idutilizador || !idrole) {
    return res.status(400).json({ message: 'idutilizador e idrole são obrigatórios.' });
  }

  try {
    const utilizador = await Utilizador.findByPk(idutilizador);
    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    await utilizador.update({ idrole });
    return res.status(200).json({ message: 'Role atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar role:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const removerRole = async (req, res) => {
  const { idutilizador } = req.body;

  if (!idutilizador) {
    return res.status(400).json({ message: 'idutilizador é obrigatório.' });
  }

  try {
    const utilizador = await Utilizador.findByPk(idutilizador);
    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    // Reset para role base (consultor)
    await utilizador.update({ idrole: ROLE_CONSULTOR });
    return res.json({ message: 'Role removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover role:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const atualizarEstadoConta = async (req, res) => {
  const { idutilizador, estadoconta } = req.body;

  const estadosValidos = ['ATIVA', 'INATIVA', 'SUSPENSA'];
  if (!estadosValidos.includes(estadoconta)) {
    return res.status(400).json({ message: 'Estado inválido.' });
  }

  try {
    const utilizador = await Utilizador.findByPk(idutilizador);
    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    await utilizador.update({ estadoconta });
    return res.json({ message: 'Estado atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar estado:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const criarUtilizador = async (req, res) => {
  const { nome, email, idrole } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  try {
    const existente = await Utilizador.findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ message: 'Já existe uma conta com este email.' });
    }

    const tempPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const roleId = idrole || ROLE_CONSULTOR;

    await Utilizador.create({
      nome,
      email,
      passwordhash: tempPassword,
      idrole: roleId,
      emailconfirmado: false,
      primeirologin: true,
    });

    return res.status(201).json({ message: 'Conta criada com sucesso. O utilizador receberá o código de ativação no primeiro login.' });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = {
  listarUtilizadores,
  listarTodasRoles,
  adicionarRole,
  removerRole,
  atualizarEstadoConta,
  criarUtilizador,
};