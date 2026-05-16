const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CandidaturaBadge = sequelize.define('CandidaturaBadge', {
  idcandidatura: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idutilizador:  { type: DataTypes.INTEGER, allowNull: false },
  idbadge:       { type: DataTypes.INTEGER, allowNull: false },
  // 'open' | 'submitted' | 'em_validacao' | 'fechado'
  estado:        { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'submitted' },
  // 'aprovado' | 'rejeitado' | null
  resultado:     { type: DataTypes.STRING(20) },
  comentario:    { type: DataTypes.TEXT },
  idtm:          { type: DataTypes.INTEGER },
  idsl:          { type: DataTypes.INTEGER },
  datacriacao:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dataatualizacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'candidaturas_badges', timestamps: false });

module.exports = CandidaturaBadge;
