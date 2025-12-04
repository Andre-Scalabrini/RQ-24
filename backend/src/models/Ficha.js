const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ficha = sequelize.define('Ficha', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  // Dados Iniciais
  projetista: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  quantidade_amostra: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  peso_peca: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  numero_pecas_molde: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  processo_moldagem: {
    type: DataTypes.ENUM('PEPSET', 'COLDBOX', 'MOLDMATIC', 'JOB'),
    allowNull: false
  },
  // Campos adicionais para JOB
  dimensao_lado_extracao: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  dimensao_lado_fixo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  extratores: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  prazo_final: {
    type: DataTypes.DATE,
    allowNull: false
  },
  peso_molde_areia: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  peso_arvore: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  // Campos Calculados
  ram: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  rm: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  // Dados da Ferramenta
  quantidade_figuras_ferramenta: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  material_ferramenta: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // Outros Campos
  posicao_vazamento: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  possui_resfriadores: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  quantidade_resfriadores: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  lateral_aco: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  luva_kalpur: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tratamento_termico_peca_bruta: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  possui_usinagem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  possui_pintura: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tratamento_termico_apos_usinagem: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tratamento_superficial: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  possui_retifica: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Status e Etapa
  etapa_atual: {
    type: DataTypes.ENUM(
      'criacao',
      'modelacao',
      'moldagem',
      'fusao',
      'rebarbacao',
      'inspecao',
      'usinagem',
      'aprovado'
    ),
    defaultValue: 'criacao'
  },
  atrasada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Campos para processo real (preenchidos no chão de fábrica)
  dados_reais_moldagem: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_fusao: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_rebarbacao: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_inspecao: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_usinagem: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // Criador
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'fichas',
  hooks: {
    beforeCreate: async (ficha) => {
      // Calcular RAM: peso total molde de areia / peso da peça
      if (ficha.peso_molde_areia && ficha.peso_peca) {
        ficha.ram = parseFloat(ficha.peso_molde_areia) / parseFloat(ficha.peso_peca);
      }
      // Calcular RM: (peso da peça / peso do conjunto) × 100
      // peso do conjunto = peso da árvore
      if (ficha.peso_peca && ficha.peso_arvore) {
        ficha.rm = (parseFloat(ficha.peso_peca) / parseFloat(ficha.peso_arvore)) * 100;
      }
    },
    beforeUpdate: async (ficha) => {
      if (ficha.changed('peso_molde_areia') || ficha.changed('peso_peca')) {
        ficha.ram = parseFloat(ficha.peso_molde_areia) / parseFloat(ficha.peso_peca);
      }
      if (ficha.changed('peso_peca') || ficha.changed('peso_arvore')) {
        ficha.rm = (parseFloat(ficha.peso_peca) / parseFloat(ficha.peso_arvore)) * 100;
      }
      // Verificar atraso
      if (ficha.prazo_final && new Date() > new Date(ficha.prazo_final)) {
        ficha.atrasada = true;
      }
    }
  }
});

module.exports = Ficha;
