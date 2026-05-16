const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LearningPath = sequelize.define('LearningPath', {
  idlearningpath: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(200), allowNull: false },
  descricao: { type: DataTypes.STRING(1000) },
  ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'learningpaths', timestamps: false });

module.exports = LearningPath;
