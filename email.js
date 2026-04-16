const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'newpg358@gmail.com',
    pass: 'uing gibx beid fgxf',
  },
});

const enviarEmailConfirmacao = async (email, nome, codigo) => {
  await transporter.sendMail({
    from: '"Plataforma PINT" <newpg358@gmail.com>',
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
    from: '"Plataforma PINT" <newpg358@gmail.com>',
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

module.exports = { enviarEmailConfirmacao, enviarEmailPrimeiroLogin };
