const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MoldeArvore = sequelize.define('MoldeArvore', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ficha_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'fichas',
      key: 'id'
    }
  },
  numero_molde: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  qualidade_aprovada: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  validado_em: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'moldes_arvore'
});

module.exports = MoldeArvore;
