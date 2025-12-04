const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacao = sequelize.define('Notificacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  ficha_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'fichas',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('atraso', 'movimentacao', 'aprovacao', 'geral'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data_leitura: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notificacoes'
});

module.exports = Notificacao;
