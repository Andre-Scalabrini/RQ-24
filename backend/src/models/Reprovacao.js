const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reprovacao = sequelize.define('Reprovacao', {
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
  etapa_reprovacao: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  etapa_retorno: {
    type: DataTypes.STRING(50),
    allowNull: true  // Now optional - fichas reprovadas go to "Reprovados" tab instead of returning to previous stage
  },
  motivo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  data_reprovacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'reprovacoes'
});

module.exports = Reprovacao;
