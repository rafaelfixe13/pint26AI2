const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UtilizadorRole = sequelize.define('UtilizadorRole', {
  idutilizador: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'utilizadores', key: 'idutilizador' },
  },
  idrole: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'roles', key: 'idrole' },
  },
}, {
  tableName: 'utilizador_roles',
  timestamps: false,
});

module.exports = UtilizadorRole;
