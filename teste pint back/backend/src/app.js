const cors = require('cors');
const express = require('express');
const path = require('path');
const { sequelize } = require('./config/database');
const tmRoutes = require('./routes/tmRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir uploads estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'Connected to database' });
  } catch (error) {
    res.status(500).json({ status: 'Not connected', error: error.message });
  }
});

// Routes
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/badges',       require('./routes/badgeRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));
app.use('/api/utilizadores', require('./routes/utilizadoresRoutes'));
app.use('/api/notificacoes', require('./routes/notificacoesRoutes'));
app.use('/api/talent',       tmRoutes);
app.use('/api/sl',           require('./routes/slRoutes'));
app.use('/api/candidaturas', require('./routes/candidaturaRoutes'));
app.use('/api/publico',      require('./routes/publicoRoutes'));
app.use('/api/lembretes',    require('./routes/lembretesRoutes'));

module.exports = app;