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

  app.listen(PORT, () => {
    console.log(`🚀 Servidor em http://localhost:${PORT}`);
  });
};

startServer();