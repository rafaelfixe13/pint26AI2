const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CandidaturaBadge = sequelize.define('CandidaturaBadge', {
  idcandidatura:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idutilizador:      { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  idbadge:           { type: DataTypes.INTEGER, allowNull: false, field: 'badge_id' },
  estado:            { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'submitted' },
  deadline:          { type: DataTypes.DATE },
  datasubmissao:     { type: DataTypes.DATE },
  dataaprovacao:     { type: DataTypes.DATE },
  datarejeicao:      { type: DataTypes.DATE },
  idrevisoratual:    { type: DataTypes.INTEGER },
  comentariogeral:   { type: DataTypes.TEXT },
  datacriacao:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  ultimaatualizacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  progresso_atual:   { type: DataTypes.INTEGER },
  progresso_total:   { type: DataTypes.INTEGER },
}, { tableName: 'candidaturasbadge', timestamps: false });

module.exports = CandidaturaBadge;