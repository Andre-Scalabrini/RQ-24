const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaixaMacho = sequelize.define('CaixaMacho', {
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
  identificacao: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Identificação como A, B, C, D, E...'
  },
  // Dados da Caixa de Macho
  material_caixa_macho: {
    type: DataTypes.ENUM('Alumínio', 'Cibatool', 'Madeira'),
    allowNull: true
  },
  peso_caixa_macho: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  // Dados do Macho
  numero_machos_peca: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  numero_figuras_caixa_macho: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  peso_macho: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  processo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  qualidade_areia_macho: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  producao_machos_hora: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  possui_pintura_macho: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tipo_pintura_macho: {
    type: DataTypes.ENUM('lavagem', 'spray'),
    allowNull: true
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'caixas_macho'
});

module.exports = CaixaMacho;
