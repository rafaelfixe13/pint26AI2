const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarEmailConfirmacao = async (email, nome, codigo) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Código de confirmação de registo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #239292;">Bem-vindo, ${nome}!</h2>
        <p>Obrigado por se registar. Use o código abaixo para confirmar a sua conta:</p>
        <div style="
          display: inline-block;
          font-size: 2.5rem;
          font-weight: bold;
          letter-spacing: 0.5rem;
          color: #1a1a2e;
          background-color: #f0f2f5;
          padding: 16px 32px;
          border-radius: 10px;
          margin: 16px 0;
        ">
          ${codigo}
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          Este código é válido por 24 horas.<br/>
          Se não se registou, ignore este email.
        </p>
      </div>
    `,
  });
};

const enviarEmailPrimeiroLogin = async (email, nome, codigo) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Ativação da sua conta PINT',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #239292;">Olá, ${nome}!</h2>
        <p>A sua conta foi criada por um administrador. Use o código abaixo para ativar a sua conta e definir a sua palavra-passe:</p>
        <div style="
          display: inline-block;
          font-size: 2.5rem;
          font-weight: bold;
          letter-spacing: 0.5rem;
          color: #1a1a2e;
          background-color: #f0f2f5;
          padding: 16px 32px;
          border-radius: 10px;
          margin: 16px 0;
        ">
          ${codigo}
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          Este código é válido por 24 horas.<br/>
          Se não esperava este email, contacte o administrador.
        </p>
      </div>
    `,
  });
};

const enviarEmailNovaCandidaturaSL = async (email, slNome, consultorNome, badgeNome) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Nova candidatura para validação: ${badgeNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #239292;">Nova candidatura para validar</h2>
        <p>Olá, ${slNome}. O consultor <strong>${consultorNome}</strong> tem uma candidatura
        ao badge <strong>${badgeNome}</strong> a aguardar a sua validação final.</p>
        <p>Aceda à área de <strong>Validações</strong> da sua Service Line para a rever.</p>
        <p style="color: #6b7280; font-size: 13px;">Este é um aviso automático da Plataforma PINT.</p>
      </div>`,
  });
};

const enviarEmailCandidaturaConfirmada = async (email, nome, badgeNome) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Candidatura submetida: ${badgeNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #239292;">Candidatura recebida, ${nome}!</h2>
        <p>A sua candidatura ao badge <strong>${badgeNome}</strong> foi submetida com sucesso.</p>
        <p>Aguarde enquanto o Talent Manager valida as suas evidências.</p>
        <p style="color: #6b7280; font-size: 13px;">Será notificado(a) quando houver uma atualização.</p>
      </div>`,
  });
};

const enviarEmailCandidaturaDevolvida = async (email, nome, badgeNome, comentario) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Candidatura devolvida: ${badgeNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #d97706;">Candidatura devolvida</h2>
        <p>Olá, ${nome}. A sua candidatura ao badge <strong>${badgeNome}</strong> foi devolvida pelo Talent Manager.</p>
        ${comentario ? `<p><strong>Motivo:</strong> ${comentario}</p>` : ''}
        <p>Por favor corrija as informações e submeta novamente.</p>
      </div>`,
  });
};

const enviarEmailCandidaturaAprovada = async (email, nome, badgeNome) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Badge aprovado: ${badgeNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #059669;">Parabéns, ${nome}!</h2>
        <p>O seu badge <strong>${badgeNome}</strong> foi <strong>aprovado</strong> pelo Service Line Leader.</p>
        <p>O badge já está disponível no seu perfil.</p>
      </div>`,
  });
};

const enviarEmailCandidaturaRejeitada = async (email, nome, badgeNome, comentario) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Candidatura rejeitada: ${badgeNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #dc2626;">Candidatura rejeitada</h2>
        <p>Olá, ${nome}. A sua candidatura ao badge <strong>${badgeNome}</strong> foi rejeitada pelo Service Line Leader.</p>
        ${comentario ? `<p><strong>Motivo:</strong> ${comentario}</p>` : ''}
      </div>`,
  });
};

const enviarEmailCandidaturaSendBack = async (email, nome, badgeNome, comentario) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Candidatura devolvida para revisão: ${badgeNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #d97706;">Candidatura devolvida para revisão</h2>
        <p>Olá, ${nome}. A sua candidatura ao badge <strong>${badgeNome}</strong> foi devolvida pelo Service Line Leader para revisão adicional.</p>
        ${comentario ? `<p><strong>Comentário:</strong> ${comentario}</p>` : ''}
        <p>Corrija as informações e submeta novamente.</p>
      </div>`,
  });
};

const enviarEmailBadgeAExpirar = async (email, nome, badgeNome, dataExpiracao, diasRestantes) => {
  const dataFmt = new Date(dataExpiracao).toLocaleDateString('pt-PT');
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `O seu badge "${badgeNome}" está a expirar`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #d97706;">Aviso de expiração</h2>
        <p>Olá, ${nome}. O seu badge <strong>${badgeNome}</strong> expira em
        <strong>${diasRestantes} dia(s)</strong> (a ${dataFmt}).</p>
        <p>Renove a sua certificação antes da data de expiração para a manter ativa no seu perfil.</p>
        <p style="color: #6b7280; font-size: 13px;">Este é um aviso automático da Plataforma PINT.</p>
      </div>`,
  });
};

const enviarEmailLembrete = async (email, nome, titulo, descricao, prazo, diasRestantes, badgeNome) => {
  const dataFmt = new Date(prazo).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const estado = diasRestantes < 0 ? 'está em atraso' : 'chegou ao prazo';
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Lembrete: ${titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2563eb;">Lembrete</h2>
        <p>Olá, ${nome}. O seu lembrete <strong>${titulo}</strong> ${estado}
        (prazo: ${dataFmt}).</p>
        ${descricao ? `<p>${descricao}</p>` : ''}
        ${badgeNome ? `<p style="color: #6b7280;">Badge associado: <strong>${badgeNome}</strong></p>` : ''}
        <p style="color: #6b7280; font-size: 13px;">Este é um aviso automático da Plataforma PINT.</p>
      </div>`,
  });
};

const enviarEmailPasswordTemporaria = async (email, nome, passwordTemp) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'A sua conta PINT — palavra-passe temporária',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #239292;">Olá, ${nome}!</h2>
        <p>A sua conta foi criada por um administrador. Use a palavra-passe temporária abaixo para entrar pela primeira vez:</p>
        <div style="
          display: inline-block;
          font-size: 1.8rem;
          font-weight: bold;
          letter-spacing: 0.15rem;
          color: #1a1a2e;
          background-color: #f0f2f5;
          padding: 16px 32px;
          border-radius: 10px;
          margin: 16px 0;
        ">
          ${passwordTemp}
        </div>
        <p>No primeiro acesso ser-lhe-á pedido para definir uma nova palavra-passe.</p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
          Por segurança, altere a palavra-passe assim que entrar.<br/>
          Se não esperava este email, contacte o administrador.
        </p>
      </div>
    `,
  });
};

// Notificação genérica enviada pelo Admin (canal email).
const enviarEmailNotificacao = async (email, titulo, mensagem) => {
  await transporter.sendMail({
    from: `"Plataforma PINT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: titulo,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #239292;">${titulo}</h2>
        <p style="color: #1a1a2e; font-size: 15px; line-height: 1.6;">${mensagem}</p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
          Plataforma de Gestão de Badges — Softinsa
        </p>
      </div>
    `,
  });
};

module.exports = {
  enviarEmailConfirmacao,
  enviarEmailPrimeiroLogin,
  enviarEmailNotificacao,
  enviarEmailNovaCandidaturaSL,
  enviarEmailCandidaturaConfirmada,
  enviarEmailCandidaturaDevolvida,
  enviarEmailCandidaturaAprovada,
  enviarEmailCandidaturaRejeitada,
  enviarEmailCandidaturaSendBack,
  enviarEmailBadgeAExpirar,
  enviarEmailLembrete,
  enviarEmailPasswordTemporaria,
};
