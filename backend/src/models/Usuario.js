const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  grupo: {
    type: DataTypes.ENUM('administrador', 'superior', 'comum'),
    allowNull: false,
    defaultValue: 'comum'
  },
  setor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'setores',
      key: 'id'
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha')) {
        usuario.senha = await bcrypt.hash(usuario.senha, 10);
      }
    }
  }
});

Usuario.prototype.verificarSenha = async function(senha) {
  return bcrypt.compare(senha, this.senha);
};

Usuario.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.senha;
  return values;
};

module.exports = Usuario;
