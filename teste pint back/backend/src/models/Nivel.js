const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Nivel = sequelize.define('Nivel', {
  idnivel: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idlearningpath: { type: DataTypes.INTEGER, allowNull: false },
  idarea: { type: DataTypes.INTEGER, allowNull: false },
  codigo: { type: DataTypes.STRING(5), allowNull: false },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  descricao: { type: DataTypes.STRING(1000) },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'niveis', timestamps: false });

module.exports = Nivel;
