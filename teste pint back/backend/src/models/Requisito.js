const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Requisito = sequelize.define('Requisito', {
  idrequisito: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idnivel: { type: DataTypes.INTEGER, allowNull: false },
  codigo: { type: DataTypes.STRING(10), allowNull: false },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(1000), allowNull: false },
  imagemurl: { type: DataTypes.STRING(500) },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'requisitos', timestamps: false });

module.exports = Requisito;
