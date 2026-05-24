const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Area = sequelize.define('Area', {
  idarea:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  idserviceline: { type: DataTypes.INTEGER, allowNull: false },
  nome:          { type: DataTypes.STRING(200), allowNull: false },
  descricao:     { type: DataTypes.STRING(1000) },
  ativo:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'areas', timestamps: false });

module.exports = Area;