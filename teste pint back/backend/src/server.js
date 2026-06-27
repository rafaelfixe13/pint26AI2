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
require('./models/Especial');
require('./models/Lembrete');

const { iniciarJobExpiracao } = require('./jobs/expiracaoBadges');

const PORT = 3000;

const startServer = async () => {
  await connectDB();

  // Jobs: avisos de expiração de badges + lembretes
  iniciarJobExpiracao();

  app.listen(PORT);
};

startServer();