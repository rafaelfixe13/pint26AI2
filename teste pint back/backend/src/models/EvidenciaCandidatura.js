const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EvidenciaCandidatura = sequelize.define('EvidenciaCandidatura', {
  idevidencia:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idcandidatura:  { type: DataTypes.INTEGER, allowNull: false },
  fileurl:        { type: DataTypes.STRING(500), allowNull: false },
  filename:       { type: DataTypes.STRING(300) },
  datacriacao:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'evidencias_candidatura', timestamps: false });

module.exports = EvidenciaCandidatura;
