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

module.exports = {
  enviarEmailConfirmacao,
  enviarEmailPrimeiroLogin,
  enviarEmailCandidaturaConfirmada,
  enviarEmailCandidaturaDevolvida,
  enviarEmailCandidaturaAprovada,
  enviarEmailCandidaturaRejeitada,
  enviarEmailCandidaturaSendBack,
};
