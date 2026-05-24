const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceLine = sequelize.define('ServiceLine', {
  idserviceline: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome:          { type: DataTypes.STRING(100), allowNull: false },
  descricao:     { type: DataTypes.TEXT },
  ativo:         { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'serviceline', timestamps: false });

module.exports = ServiceLine;