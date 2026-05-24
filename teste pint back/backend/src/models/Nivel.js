const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Nivel = sequelize.define('Nivel', {
  idnivel:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome:      { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descricao: { type: DataTypes.STRING(255) },
}, { tableName: 'nivel', timestamps: false });

module.exports = Nivel;