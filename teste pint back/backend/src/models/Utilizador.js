const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Utilizador = sequelize.define('Utilizador', {
  idutilizador: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
  },
  passwordhash: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  fotourl: {
    type: DataTypes.STRING(500),
  },
  idrole: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  idserviceline: {
    type: DataTypes.INTEGER,
  },
  idarea: {
    type: DataTypes.INTEGER,
  },
  emailconfirmado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  primeirologin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  datacriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  ultimadatalogin: {
    type: DataTypes.DATE,
  },
  estadoconta: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'ATIVA',
  },
  tokenconfirmacao: {
    type: DataTypes.STRING(500),
  },
}, {
  tableName: 'utilizadores',
  timestamps: false,
});

const UtilizadorRole = require('./UtilizadorRole');
Utilizador.hasMany(UtilizadorRole, { foreignKey: 'idutilizador' });
UtilizadorRole.belongsTo(Utilizador, { foreignKey: 'idutilizador' });

module.exports = Utilizador;
