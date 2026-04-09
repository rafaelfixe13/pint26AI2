const app = require('./app');
const { sequelize, connectDB } = require('./config/database');

require('./models/Utilizador');
require('./models/UtilizadorRole');
require('./models/LearningPath');
require('./models/ServiceLine');
require('./models/Area');
require('./models/Nivel');
require('./models/Badge');
require('./models/Requisito');

const PORT = 3000;

const startServer = async () => {
  await connectDB();
  await sequelize.sync();

  // Colunas auxiliares de autenticação
  await sequelize.query(`ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS tokenconfirmacao VARCHAR(500);`);

  // Tabela de roles por utilizador
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS utilizador_roles (
      idutilizador INT NOT NULL REFERENCES utilizadores(idutilizador) ON DELETE CASCADE,
      idrole       INT NOT NULL REFERENCES roles(idrole) ON DELETE CASCADE,
      PRIMARY KEY (idutilizador, idrole)
    );
  `);

  // Soft delete — adiciona coluna ativo onde ainda não existe
  await sequelize.query(`ALTER TABLE servicelines ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE areas        ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE niveis       ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE requisitos   ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE badges       ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);

  app.listen(PORT, () => {
    console.log(`Servidor em http://localhost:${PORT}`);
  });
};

startServer();
