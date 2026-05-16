const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'testes2',   // ⚠️ mete aqui o nome da base de dados
  'pint',     // user
  'pint26',     // ⚠️ mete a password
  {
    host: '100.105.58.22',
    port: 5432,           // default do postgres
    dialect: 'postgres',
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Ligado ao PostgreSQL');
  } catch (error) {
    console.error('❌ Erro ao ligar à BD:', error);
  }
};

module.exports = { sequelize, connectDB };