const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UtilizadorRequisito = sequelize.define('UtilizadorRequisito', {
  idutilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  idrequisito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  dataconclusao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, { tableName: 'utilizador_requisitos', timestamps: false });

module.exports = UtilizadorRequisito;
