const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Informações genéricas e avisos (Sobre / Ajuda / Avisos), com estado ativo/inativo.
const Informacao = sequelize.define('Informacao', {
  idinformacao: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo:         { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'aviso' }, // 'sobre' | 'ajuda' | 'aviso'
  titulo:       { type: DataTypes.STRING(200), allowNull: false },
  conteudo:     { type: DataTypes.TEXT, allowNull: false },
  ativo:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  ordem:        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  datacriacao:  { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'informacoes', timestamps: false });

module.exports = Informacao;
