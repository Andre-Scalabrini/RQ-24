const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Movimentacao = sequelize.define('Movimentacao', {
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
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  etapa_origem: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  etapa_destino: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_movimentacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'movimentacoes'
});

module.exports = Movimentacao;
