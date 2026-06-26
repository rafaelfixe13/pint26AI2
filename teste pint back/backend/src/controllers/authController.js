const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Utilizador = require('../models/Utilizador');
const { sequelize } = require('../config/database');
const { enviarEmailPrimeiroLogin } = require('../config/email');

const gerarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

const ROLE_CONSULTOR = 1;

// GET /api/auth/areas — lista de áreas para o registo
const listarAreas = async (_req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT a.idarea, a.nome, a.idserviceline, sl.nome AS serviceline
       FROM areas a
       LEFT JOIN serviceline sl ON sl.idserviceline = a.idserviceline
       ORDER BY sl.nome, a.nome`,
      { type: sequelize.QueryTypes.SELECT }
    );
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao listar áreas:', error.message);
    return res.status(500).json({ message: 'Erro interno.' });
  }
};

// POST /api/auth/register — registo do consultor (com escolha da área)
const registar = async (req, res) => {
  const { nome, email, idarea, idserviceline } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  try {
    const existente = await Utilizador.findOne({ where: { email } });
    if (existente) {
      return res.status(409).json({ message: 'Já existe uma conta com este email.' });
    }

    const codigo = gerarCodigo();
    const tempPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    await Utilizador.create({
      nome,
      email,
      passwordhash: tempPassword,
      idrole: ROLE_CONSULTOR,
      idarea: idarea || null,
      idserviceline: idserviceline || null,
      emailconfirmado: false,
      primeirologin: true,
      tokenconfirmacao: codigo,
    });

    try { await enviarEmailPrimeiroLogin(email, nome, codigo); } catch (_) {}

    return res.status(201).json({
      message: 'Conta criada. Verifique o seu email para o código de ativação.',
      email,
    });
  } catch (error) {
    console.error('Erro no registo:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const getRolesDoUtilizador = async (idutilizador) => {
  const utilizador = await Utilizador.findByPk(idutilizador);
  return utilizador ? [utilizador.idrole] : [];
};

const login = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório.' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email } });

    if (!utilizador) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    if (utilizador.estadoconta !== 'ATIVA') {
      return res.status(403).json({ message: 'Conta inativa ou suspensa.' });
    }

    // Primeiro login: enviar código de ativação e aguardar confirmação
    if (utilizador.primeirologin && !utilizador.emailconfirmado) {
      const codigo = gerarCodigo();
      await utilizador.update({ tokenconfirmacao: codigo });
      await enviarEmailPrimeiroLogin(utilizador.email, utilizador.nome, codigo);
      return res.status(200).json({
        primeiroLogin: true,
        message: 'Código de ativação enviado para o seu email.',
        email: utilizador.email,
      });
    }

    // Login normal: verificar email confirmado e password
    if (!utilizador.emailconfirmado) {
      return res.status(403).json({
        message: 'Confirme o seu email antes de entrar.',
        emailNaoConfirmado: true,
        email: utilizador.email,
      });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password é obrigatória.' });
    }

    const passwordCorreta = await bcrypt.compare(password, utilizador.passwordhash);
    if (!passwordCorreta) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const ultimoLoginAnterior = utilizador.ultimadatalogin;
    await utilizador.update({ ultimadatalogin: new Date() });

    const roles = await getRolesDoUtilizador(utilizador.idutilizador);

    return res.json({
      message: 'Login efetuado com sucesso.',
      mudarPassword: utilizador.primeirologin === true,
      utilizador: {
        id: utilizador.idutilizador,
        idutilizador: utilizador.idutilizador,
        nome: utilizador.nome,
        email: utilizador.email,
        fotourl: utilizador.fotourl,
        datacriacao: utilizador.datacriacao,
        estadoconta: utilizador.estadoconta,
        idrole: utilizador.idrole,
        roles,
        idserviceline: utilizador.idserviceline,
        idarea: utilizador.idarea,
        rgpd: utilizador.rgpd,
        ultimadatalogin: ultimoLoginAnterior,
        primeirologin: false,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
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

    return res.json({ message: 'Código confirmado. Pode agora definir a sua palavra-passe.' });
  } catch (error) {
    console.error('Erro ao confirmar email:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

const definirPassword = async (req, res) => {
  const { email, novaPassword } = req.body;

  if (!email || !novaPassword) {
    return res.status(400).json({ message: 'Email e nova password são obrigatórios.' });
  }

  if (novaPassword.length < 6) {
    return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email } });

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    if (!utilizador.emailconfirmado) {
      return res.status(403).json({ message: 'Email ainda não confirmado.' });
    }

    if (!utilizador.primeirologin) {
      return res.status(400).json({ message: 'Esta conta já tem palavra-passe definida.' });
    }

    const novaHash = await bcrypt.hash(novaPassword, 10);
    await utilizador.update({ passwordhash: novaHash, primeirologin: false });

    return res.json({ message: 'Palavra-passe definida com sucesso. Pode agora fazer login.' });
  } catch (error) {
    console.error('Erro ao definir password:', error);
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

// POST /api/auth/recuperar  body: { email }
// Gera um código e envia por email (resposta genérica para não revelar se o email existe)
const recuperarPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email é obrigatório.' });

  try {
    const utilizador = await Utilizador.findOne({ where: { email } });
    if (utilizador) {
      const codigo = gerarCodigo();
      await utilizador.update({ tokenconfirmacao: codigo });
      try { await enviarEmailPrimeiroLogin(utilizador.email, utilizador.nome, codigo); } catch (_) {}
    }
    return res.json({
      message: 'Se o email estiver registado, enviámos um código para repor a palavra-passe.',
    });
  } catch (error) {
    console.error('Erro ao recuperar password:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

// POST /api/auth/redefinir  body: { email, codigo, novaPassword }
const redefinirPassword = async (req, res) => {
  const { email, codigo, novaPassword } = req.body;

  if (!email || !codigo || !novaPassword) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }
  if (novaPassword.length < 6) {
    return res.status(400).json({ message: 'A password deve ter pelo menos 6 caracteres.' });
  }

  try {
    const utilizador = await Utilizador.findOne({ where: { email } });
    if (!utilizador) return res.status(404).json({ message: 'Utilizador não encontrado.' });

    if (!utilizador.tokenconfirmacao || utilizador.tokenconfirmacao !== codigo) {
      return res.status(400).json({ message: 'Código inválido. Verifique o seu email.' });
    }

    const novaHash = await bcrypt.hash(novaPassword, 10);
    await utilizador.update({
      passwordhash: novaHash,
      tokenconfirmacao: null,
      emailconfirmado: true,
      primeirologin: false,
    });

    return res.json({ message: 'A sua password foi redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir password:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = {
  login, confirmarEmail, definirPassword, alterarPassword, registar, listarAreas,
  recuperarPassword, redefinirPassword,
};