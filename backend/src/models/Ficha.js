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
  // CABEÇALHO - Campos obrigatórios na criação
  projetista: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  codigo_peca: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cliente: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  descricao_peca: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  quantidade_amostra: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  prazo_final: {
    type: DataTypes.DATE,
    allowNull: false
  },
  seguir_norma: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  
  // DADOS GERAIS - Estimado (preenchido na criação)
  material_estimado: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  peso_peca_estimado: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  numero_pecas_molde_estimado: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  peso_molde_estimado: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  peso_arvore_estimado: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  peso_canal_cubeta_estimado: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  numero_moldes_arvore_estimado: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // DADOS GERAIS - Obtido (preenchido durante o processo)
  material_obtido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  peso_peca_obtido: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  numero_pecas_molde_obtido: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  peso_molde_obtido: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  peso_arvore_obtido: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  peso_canal_cubeta_obtido: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  numero_moldes_arvore_obtido: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // Campos Calculados (estimado e obtido)
  ram_estimado: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  rm_estimado: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  ram_obtido: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  rm_obtido: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  
  // Legacy fields for backwards compatibility
  material: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  peso_peca: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  numero_pecas_molde: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  processo_moldagem: {
    type: DataTypes.ENUM('PEPSET', 'COLDBOX', 'MOLDMATIC', 'JOB'),
    allowNull: true
  },
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
  peso_molde_areia: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  peso_arvore: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  ram: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  rm: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  quantidade_figuras_ferramenta: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  material_ferramenta: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  posicao_vazamento: {
    type: DataTypes.STRING(100),
    allowNull: true
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
  
  // Status e Etapa - 10 etapas conforme RQ-24 Rev. 06
  etapa_atual: {
    type: DataTypes.ENUM(
      'criacao',
      'modelacao',
      'moldagem',
      'fusao',
      'acabamento',
      'analise_critica',
      'inspecao',
      'dimensional',
      'usinagem',
      'aprovado'
    ),
    defaultValue: 'criacao'
  },
  atrasada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  quantidade_reprovacoes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('em_andamento', 'aprovada', 'reprovada_final'),
    defaultValue: 'em_andamento'
  },
  data_aprovacao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Dados reais por etapa (JSON para flexibilidade)
  dados_reais_modelacao: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_moldagem: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_fusao: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_acabamento: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_analise_critica: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_inspecao: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_dimensional: {
    type: DataTypes.JSON,
    allowNull: true
  },
  dados_reais_usinagem: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Legacy field for backwards compatibility
  dados_reais_rebarbacao: {
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
      // Calcular RAM estimado: peso do molde / peso da peça
      const pesoPecaEst = parseFloat(ficha.peso_peca_estimado || ficha.peso_peca);
      const pesoMoldeEst = parseFloat(ficha.peso_molde_estimado || ficha.peso_molde_areia);
      if (pesoMoldeEst && pesoPecaEst > 0) {
        ficha.ram_estimado = pesoMoldeEst / pesoPecaEst;
        ficha.ram = ficha.ram_estimado; // Legacy
      }
      // Calcular RM estimado: (peso da peça / peso da árvore) × 100
      const pesoArvoreEst = parseFloat(ficha.peso_arvore_estimado || ficha.peso_arvore);
      if (pesoPecaEst && pesoArvoreEst > 0) {
        ficha.rm_estimado = (pesoPecaEst / pesoArvoreEst) * 100;
        ficha.rm = ficha.rm_estimado; // Legacy
      }
    },
    beforeUpdate: async (ficha) => {
      // Recalcular RAM/RM estimado
      if (ficha.changed('peso_molde_estimado') || ficha.changed('peso_peca_estimado') ||
          ficha.changed('peso_molde_areia') || ficha.changed('peso_peca')) {
        const pesoPeca = parseFloat(ficha.peso_peca_estimado || ficha.peso_peca);
        const pesoMolde = parseFloat(ficha.peso_molde_estimado || ficha.peso_molde_areia);
        if (pesoPeca > 0 && pesoMolde) {
          ficha.ram_estimado = pesoMolde / pesoPeca;
          ficha.ram = ficha.ram_estimado;
        }
      }
      if (ficha.changed('peso_peca_estimado') || ficha.changed('peso_arvore_estimado') ||
          ficha.changed('peso_peca') || ficha.changed('peso_arvore')) {
        const pesoPeca = parseFloat(ficha.peso_peca_estimado || ficha.peso_peca);
        const pesoArvore = parseFloat(ficha.peso_arvore_estimado || ficha.peso_arvore);
        if (pesoArvore > 0 && pesoPeca) {
          ficha.rm_estimado = (pesoPeca / pesoArvore) * 100;
          ficha.rm = ficha.rm_estimado;
        }
      }
      // Recalcular RAM/RM obtido
      if (ficha.changed('peso_molde_obtido') || ficha.changed('peso_peca_obtido')) {
        const pesoPeca = parseFloat(ficha.peso_peca_obtido);
        const pesoMolde = parseFloat(ficha.peso_molde_obtido);
        if (pesoPeca > 0 && pesoMolde) {
          ficha.ram_obtido = pesoMolde / pesoPeca;
        }
      }
      if (ficha.changed('peso_peca_obtido') || ficha.changed('peso_arvore_obtido')) {
        const pesoPeca = parseFloat(ficha.peso_peca_obtido);
        const pesoArvore = parseFloat(ficha.peso_arvore_obtido);
        if (pesoArvore > 0 && pesoPeca) {
          ficha.rm_obtido = (pesoPeca / pesoArvore) * 100;
        }
      }
      // Verificar atraso
      if (ficha.prazo_final && new Date() > new Date(ficha.prazo_final)) {
        ficha.atrasada = true;
      }
    }
  }
});

module.exports = Ficha;
