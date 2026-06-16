const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Especial = sequelize.define('Especial', {
  idespecial:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome:          { type: DataTypes.STRING(255), allowNull: false },
  descricao:     { type: DataTypes.TEXT },
  ativo:         { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em:     { type: DataTypes.DATE },
  atualizado_em: { type: DataTypes.DATE },
}, { tableName: 'especial', timestamps: false });

module.exports = Especial;
