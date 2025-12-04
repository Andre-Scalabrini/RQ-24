const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Imagem = sequelize.define('Imagem', {
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
  etapa: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  nome_arquivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  caminho: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  tipo_mime: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  tamanho: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'imagens'
});

module.exports = Imagem;
