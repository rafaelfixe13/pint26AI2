const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UtilizadorBadge = sequelize.define('UtilizadorBadge', {
  idutilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  idbadge: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  dataconquista: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, { tableName: 'utilizador_badges', timestamps: false });

module.exports = UtilizadorBadge;
