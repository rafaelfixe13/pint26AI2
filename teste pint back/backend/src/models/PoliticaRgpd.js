const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Conteúdo editável da política de RGPD. Existe uma política ativa de cada vez.
const PoliticaRgpd = sequelize.define('PoliticaRgpd', {
  idpolitica:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titulo:          { type: DataTypes.STRING(200), allowNull: false },
  conteudo:        { type: DataTypes.TEXT, allowNull: false },
  versao:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  ativo:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  dataatualizacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'politica_rgpd', timestamps: false });

module.exports = PoliticaRgpd;
