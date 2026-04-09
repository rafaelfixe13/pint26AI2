const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Badge = sequelize.define('Badge', {
  idbadge: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idnivel: { type: DataTypes.INTEGER, allowNull: false },
  nome: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(1000) },
  imagemurl: { type: DataTypes.STRING(500) },
  pontos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  expiremeses: { type: DataTypes.INTEGER },
  linkpublicobase: { type: DataTypes.STRING(500) },
  ispublico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'badges', timestamps: false });

module.exports = Badge;
