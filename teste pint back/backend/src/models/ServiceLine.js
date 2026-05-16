const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceLine = sequelize.define('ServiceLine', {
  idserviceline: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(1000) },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'servicelines', timestamps: false });

module.exports = ServiceLine;
