const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Badge = sequelize.define('Badge', {
  idbadge:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome:            { type: DataTypes.STRING(255), allowNull: false },
  descricao:       { type: DataTypes.STRING(255), allowNull: false },
  imagemurl:       { type: DataTypes.TEXT },
  pontos:          { type: DataTypes.INTEGER, allowNull: false },
  expiremeses:     { type: DataTypes.INTEGER },
  linkpublicobase: { type: DataTypes.STRING(500) },
  ispublico:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  competencias:    { type: DataTypes.STRING(2000) },
  ativo:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  idnivel:         { type: DataTypes.INTEGER },
  idarea:          { type: DataTypes.INTEGER },
  certificado:     { type: DataTypes.TEXT },
  idespecial:      { type: DataTypes.INTEGER },
}, { tableName: 'badges', timestamps: false });

module.exports = Badge;