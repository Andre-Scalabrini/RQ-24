const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ImagemReprovacao = sequelize.define('ImagemReprovacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reprovacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reprovacoes',
      key: 'id'
    }
  },
  caminho_imagem: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'imagens_reprovacao'
});

module.exports = ImagemReprovacao;
