const cors = require('cors');
const express = require('express');
const { sequelize } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// DB status route
app.get('/db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'Connected to database' });
  } catch (error) {
    res.status(500).json({ status: 'Not connected', error: error.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/badges', require('./routes/badgeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const path = require('path');

// Serve a pasta uploads estaticamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota utilizadores
app.use('/api/utilizadores', require('./routes/utilizadoresRoutes'));

app.use('/api/notificacoes', require('./routes/notificacoesRoutes'));

module.exports = app;
