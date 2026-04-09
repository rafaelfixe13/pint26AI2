const bcrypt = require('bcryptjs');
const Utilizador = require('../models/Utilizador');
const UtilizadorRole = require('../models/UtilizadorRole');
const { enviarEmailConfirmacao } = require('../config/email');

const ROLE_CONSULTOR = 1;

const gerarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

// Busca todas as roles de um utilizador da tabela de ligação
const getRolesDoUtilizador = async (idutilizador) => {
  const registos = await UtilizadorRole.findAll({ where: { idutilizador } });
  return registos.map((r) => r.idrole);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password são obrigatórios.' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email } });

    if (!utilizador) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (!utilizador.emailconfirmado) {
      return res.status(403).json({
        message: 'Confirme o seu email antes de entrar.',
        emailNaoConfirmado: true,
        email: utilizador.email,
      });
    }

    if (utilizador.estadoconta !== 'ATIVA') {
      return res.status(403).json({ message: 'Conta inativa ou suspensa.' });
    }

    const passwordCorreta = await bcrypt.compare(password, utilizador.passwordhash);
    if (!passwordCorreta) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    await utilizador.update({ ultimadatalogin: new Date() });

    const roles = await getRolesDoUtilizador(utilizador.idutilizador);

    return res.json({
      message: 'Login efetuado com sucesso.',
      utilizador: {
        id: utilizador.idutilizador,
        nome: utilizador.nome,
        email: utilizador.email,
        idrole: utilizador.idrole,
        roles,                          // array com todas as roles
        idserviceline: utilizador.idserviceline,
        idarea: utilizador.idarea,
        primeirologin: utilizador.primeirologin,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const register = async (req, res) => {
  const { nome, email, password } = req.body;

  if (!nome || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e password são obrigatórios.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const existente = await Utilizador.findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ message: 'Já existe uma conta com este email.' });
    }

    const passwordhash = await bcrypt.hash(password, 10);
    const codigo = gerarCodigo();

    const novoUtilizador = await Utilizador.create({
      nome,
      email,
      passwordhash,
      idrole: ROLE_CONSULTOR,
      tokenconfirmacao: codigo,
    });

    // Insere a role de CONSULTOR na tabela de ligação
    await UtilizadorRole.create({
      idutilizador: novoUtilizador.idutilizador,
      idrole: ROLE_CONSULTOR,
    });

    await enviarEmailConfirmacao(email, nome, codigo);

    return res.status(201).json({
      message: 'Conta criada. Verifique o seu email para obter o código de confirmação.',
    });
  } catch (error) {
    console.error('Erro no registo:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const confirmarEmail = async (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ message: 'Email e código são obrigatórios.' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email } });

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (utilizador.emailconfirmado) {
      return res.status(400).json({ message: 'Esta conta já foi confirmada.' });
    }

    if (utilizador.tokenconfirmacao !== codigo) {
      return res.status(400).json({ message: 'Código inválido. Verifique o seu email.' });
    }

    await utilizador.update({ emailconfirmado: true, tokenconfirmacao: null });

    return res.json({ message: 'Email confirmado com sucesso. Pode fazer login.' });
  } catch (error) {
    console.error('Erro ao confirmar email:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const alterarPassword = async (req, res) => {
  const { id, passwordAtual, novaPassword } = req.body;

  if (!id || !passwordAtual || !novaPassword) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  if (novaPassword.length < 6) {
    return res.status(400).json({ message: 'A nova password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const utilizador = await Utilizador.findByPk(id);

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const passwordCorreta = await bcrypt.compare(passwordAtual, utilizador.passwordhash);
    if (!passwordCorreta) {
      return res.status(401).json({ message: 'Password atual incorreta.' });
    }

    const novaHash = await bcrypt.hash(novaPassword, 10);
    await utilizador.update({ passwordhash: novaHash, primeirologin: false });

    return res.json({ message: 'Password alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar password:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Adiciona uma role extra a um utilizador (uso administrativo)
const adicionarRole = async (req, res) => {
  const { idutilizador, idrole } = req.body;

  if (!idutilizador || !idrole) {
    return res.status(400).json({ message: 'idutilizador e idrole são obrigatórios.' });
  }

  try {
    const existente = await UtilizadorRole.findOne({ where: { idutilizador, idrole } });
    if (existente) {
      return res.status(409).json({ message: 'O utilizador já tem essa role.' });
    }

    await UtilizadorRole.create({ idutilizador, idrole });

    return res.status(201).json({ message: 'Role adicionada com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar role:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// Remove uma role de um utilizador (uso administrativo)
const removerRole = async (req, res) => {
  const { idutilizador, idrole } = req.body;

  if (!idutilizador || !idrole) {
    return res.status(400).json({ message: 'idutilizador e idrole são obrigatórios.' });
  }

  try {
    const deleted = await UtilizadorRole.destroy({ where: { idutilizador, idrole } });
    if (!deleted) {
      return res.status(404).json({ message: 'Relação não encontrada.' });
    }

    return res.json({ message: 'Role removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover role:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = { login, register, confirmarEmail, alterarPassword, adicionarRole, removerRole };
