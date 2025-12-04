const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LuvaKalpur = sequelize.define('LuvaKalpur', {
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
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  peso_kg: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  ordem: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'luvas_kalpur'
});

module.exports = LuvaKalpur;
