const bcrypt = require('bcryptjs');
const Utilizador = require('../models/Utilizador');
const UtilizadorRole = require('../models/UtilizadorRole');
const { enviarEmailPrimeiroLogin } = require('../config/email');

const gerarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

const getRolesDoUtilizador = async (idutilizador) => {
  const registos = await UtilizadorRole.findAll({ where: { idutilizador } });
  return registos.map((r) => r.idrole);
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

// Usado apenas no primeiro login, após confirmação do código
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

// Alteração de password para utilizadores já com conta ativa
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
    await utilizador.update({ passwordhash: novaHash });

    return res.json({ message: 'Password alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar password:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = { login, confirmarEmail, definirPassword, alterarPassword };
