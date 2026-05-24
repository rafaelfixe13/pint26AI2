const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EvidenciaCandidatura = sequelize.define('EvidenciaCandidatura', {
  idevidencia:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idcandidaturareq: { type: DataTypes.INTEGER, allowNull: false },
  ficheirourl:      { type: DataTypes.STRING(500), allowNull: false },
  descricao:        { type: DataTypes.STRING(1000) },
  dataupload:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'evidencias', timestamps: false });

module.exports = EvidenciaCandidatura;