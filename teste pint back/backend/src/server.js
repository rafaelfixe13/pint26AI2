require('dotenv').config();
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
require('./models/UtilizadorRequisito');
require('./models/UtilizadorBadge');
require('./models/Notificacao');
require('./models/CandidaturaBadge');
require('./models/EvidenciaCandidatura');

const PORT = 3000;

const startServer = async () => {
  await connectDB();

  // Criar tabela roles antes do sync (é referenciada por utilizador_roles)
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS roles (
      idrole SERIAL PRIMARY KEY,
      nome   VARCHAR(50) NOT NULL UNIQUE
    );
  `);

  await sequelize.sync();

  // Colunas auxiliares de autenticação
  await sequelize.query(`ALTER TABLE utilizadores ADD COLUMN IF NOT EXISTS tokenconfirmacao VARCHAR(500);`);

  // Soft delete — adiciona coluna ativo onde ainda não existe
  await sequelize.query(`ALTER TABLE servicelines ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE areas        ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE niveis       ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE requisitos   ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);
  await sequelize.query(`ALTER TABLE badges       ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;`);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS utilizador_requisitos (
      idutilizador INT NOT NULL REFERENCES utilizadores(idutilizador) ON DELETE CASCADE,
      idrequisito  INT NOT NULL REFERENCES requisitos(idrequisito) ON DELETE CASCADE,
      dataconclusao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (idutilizador, idrequisito)
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS utilizador_badges (
      idutilizador INT NOT NULL REFERENCES utilizadores(idutilizador) ON DELETE CASCADE,
      idbadge      INT NOT NULL REFERENCES badges(idbadge) ON DELETE CASCADE,
      dataconquista TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (idutilizador, idbadge)
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS candidaturasbadge (
      idcandidatura   SERIAL PRIMARY KEY,
      idutilizador    INT NOT NULL REFERENCES utilizadores(idutilizador) ON DELETE CASCADE,
      idbadge         INT NOT NULL REFERENCES badges(idbadge) ON DELETE CASCADE,
      estado          VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
      resultado       VARCHAR(20),
      comentario      TEXT,
      idtm            INT REFERENCES utilizadores(idutilizador) ON DELETE SET NULL,
      idsl            INT REFERENCES utilizadores(idutilizador) ON DELETE SET NULL,
      datacriacao     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      dataatualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS evidencias_candidatura (
      idevidencia   SERIAL PRIMARY KEY,
      idcandidatura INT NOT NULL REFERENCES candidaturasbadge(idcandidatura) ON DELETE CASCADE,
      fileurl       VARCHAR(500) NOT NULL,
      filename      VARCHAR(300),
      datacriacao   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  app.listen(PORT, () => {
    console.log(`Servidor em http://localhost:${PORT}`);
  });
};

startServer();
