const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Requisito = sequelize.define('Requisito', {
  idrequisito: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idbadge: { type: DataTypes.INTEGER, allowNull: false },
  codigo: { type: DataTypes.STRING(10), allowNull: false },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(1000), allowNull: false },
  imagemurl: { type: DataTypes.TEXT },
  ordem: { type: DataTypes.INTEGER, allowNull: true },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'requisitos', timestamps: false });

module.exports = Requisito;
