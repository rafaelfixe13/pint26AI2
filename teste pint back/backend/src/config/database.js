require('dotenv').config();
const { Sequelize } = require('sequelize');

const { DB_NAME, DB_USER, DB_PASSWORD } = process.env;

if (!DB_NAME || !DB_USER || !DB_PASSWORD) {
  throw new Error(
    'Faltam variáveis de ambiente da base de dados (DB_NAME, DB_USER, DB_PASSWORD). Verifica o ficheiro .env (ver .env.example).'
  );
}

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Ligado ao PostgreSQL');

    // Garante que imagemurl dos requisitos aceita ficheiros base64 (imagens/PDFs).
    // Idempotente: se já for TEXT (ou a tabela ainda não existir) não faz nada.
    try {
      await sequelize.query('ALTER TABLE requisitos ALTER COLUMN imagemurl TYPE TEXT');
    } catch (_) { /* ignora se a coluna já é TEXT ou tabela inexistente */ }
  } catch (error) {
    console.error('❌ Erro ao ligar à BD:', error);
  }
};

module.exports = { sequelize, connectDB };