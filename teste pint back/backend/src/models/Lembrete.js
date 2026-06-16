const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lembrete = sequelize.define('Lembrete', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  utilizador_id: { type: DataTypes.INTEGER, allowNull: false },
  titulo:        { type: DataTypes.STRING(255), allowNull: false },
  descricao:     { type: DataTypes.TEXT },
  badge_id:      { type: DataTypes.INTEGER },
  badge_nome:    { type: DataTypes.STRING(255) },
  prazo:         { type: DataTypes.DATE, allowNull: false },
  concluido:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  criado_em:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'lembretes', timestamps: false });

module.exports = Lembrete;
