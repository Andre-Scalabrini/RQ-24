const { Op } = require('sequelize');
const { 
  Ficha, 
  CaixaMacho, 
  MoldeArvore, 
  Movimentacao, 
  Usuario, 
  Imagem,
  Notificacao,
  Setor 
} = require('../models');
const NotificacaoService = require('../services/NotificacaoService');

// Mapeamento de etapas
const ETAPAS = {
  criacao: { ordem: 1, nome: 'Criação da Ficha' },
  modelacao: { ordem: 2, nome: 'Modelação' },
  moldagem: { ordem: 3, nome: 'Moldagem' },
  fusao: { ordem: 4, nome: 'Fusão' },
  rebarbacao: { ordem: 5, nome: 'Rebarbação' },
  inspecao: { ordem: 6, nome: 'Inspeção' },
  usinagem: { ordem: 7, nome: 'Usinagem' },
  aprovado: { ordem: 8, nome: 'Aprovado' }
};

// Função para obter próxima etapa
const getProximaEtapa = (etapaAtual, possuiUsinagem) => {
  const etapas = Object.keys(ETAPAS);
  const indexAtual = etapas.indexOf(etapaAtual);
  
  if (indexAtual === -1 || indexAtual === etapas.length - 1) {
    return null;
  }
  
  let proximaEtapa = etapas[indexAtual + 1];
  
  // Se não possui usinagem e a próxima etapa seria usinagem, pula para aprovado
  if (proximaEtapa === 'usinagem' && !possuiUsinagem) {
    proximaEtapa = 'aprovado';
  }
  
  return proximaEtapa;
};

// Função para gerar código da ficha
const gerarCodigo = async () => {
  const ano = new Date().getFullYear();
  const ultimaFicha = await Ficha.findOne({
    where: {
      codigo: {
        [Op.like]: `RQ-24-${ano}-%`
      }
    },
    order: [['id', 'DESC']]
  });

  let numero = 1;
  if (ultimaFicha) {
    const partes = ultimaFicha.codigo.split('-');
    numero = parseInt(partes[partes.length - 1], 10) + 1;
  }

  return `RQ-24-${ano}-${numero.toString().padStart(4, '0')}`;
};

class FichaController {
  async index(req, res) {
    try {
      const { etapa, atrasada } = req.query;
      
      const where = {};
      
      if (etapa) {
        where.etapa_atual = etapa;
      }
      
      if (atrasada !== undefined) {
        where.atrasada = atrasada === 'true';
      }

      const fichas = await Ficha.findAll({
        where,
        include: [
          { model: CaixaMacho, as: 'caixas_macho' },
          { model: MoldeArvore, as: 'moldes_arvore' },
          { model: Usuario, as: 'criador', attributes: ['id', 'nome', 'email'] },
          { 
            model: Movimentacao, 
            as: 'movimentacoes',
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
            order: [['data_movimentacao', 'DESC']],
            limit: 5
          }
        ],
        order: [
          ['atrasada', 'DESC'], // Atrasadas primeiro
          ['prazo_final', 'ASC']
        ]
      });

      return res.json(fichas);
    } catch (error) {
      console.error('Erro ao listar fichas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async kanban(req, res) {
    try {
      // Atualizar status de atraso antes de retornar
      await Ficha.update(
        { atrasada: true },
        { 
          where: { 
            prazo_final: { [Op.lt]: new Date() },
            etapa_atual: { [Op.ne]: 'aprovado' },
            atrasada: false
          } 
        }
      );

      const fichas = await Ficha.findAll({
        include: [
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] },
          { model: CaixaMacho, as: 'caixas_macho' },
          { model: MoldeArvore, as: 'moldes_arvore' }
        ],
        order: [
          ['atrasada', 'DESC'],
          ['prazo_final', 'ASC']
        ]
      });

      // Agrupar por etapa
      const kanban = {};
      Object.keys(ETAPAS).forEach(etapa => {
        kanban[etapa] = {
          ...ETAPAS[etapa],
          fichas: []
        };
      });

      fichas.forEach(ficha => {
        if (kanban[ficha.etapa_atual]) {
          kanban[ficha.etapa_atual].fichas.push(ficha);
        }
      });

      return res.json(kanban);
    } catch (error) {
      console.error('Erro ao carregar Kanban:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const ficha = await Ficha.findByPk(id, {
        include: [
          { model: CaixaMacho, as: 'caixas_macho', order: [['ordem', 'ASC']] },
          { model: MoldeArvore, as: 'moldes_arvore', order: [['ordem', 'ASC']] },
          { model: Usuario, as: 'criador', attributes: ['id', 'nome', 'email'] },
          { 
            model: Movimentacao, 
            as: 'movimentacoes',
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
            order: [['data_movimentacao', 'DESC']]
          },
          {
            model: Imagem,
            as: 'imagens',
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }]
          }
        ]
      });

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      return res.json(ficha);
    } catch (error) {
      console.error('Erro ao buscar ficha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const codigo = await gerarCodigo();
      
      const fichaData = {
        ...req.body,
        codigo,
        criado_por: req.usuarioId,
        etapa_atual: 'criacao'
      };

      // Calcular campos automáticos
      if (fichaData.peso_molde_areia && fichaData.peso_peca) {
        fichaData.ram = parseFloat(fichaData.peso_molde_areia) / parseFloat(fichaData.peso_peca);
      }
      if (fichaData.peso_peca && fichaData.peso_arvore) {
        fichaData.rm = (parseFloat(fichaData.peso_peca) / parseFloat(fichaData.peso_arvore)) * 100;
      }

      // Verificar se está atrasada
      if (fichaData.prazo_final && new Date(fichaData.prazo_final) < new Date()) {
        fichaData.atrasada = true;
      }

      const ficha = await Ficha.create(fichaData);

      // Criar caixas de macho
      if (req.body.caixas_macho && Array.isArray(req.body.caixas_macho)) {
        for (let i = 0; i < req.body.caixas_macho.length; i++) {
          await CaixaMacho.create({
            ...req.body.caixas_macho[i],
            ficha_id: ficha.id,
            ordem: i + 1
          });
        }
      }

      // Criar moldes de árvore
      if (req.body.moldes_arvore && Array.isArray(req.body.moldes_arvore)) {
        for (let i = 0; i < req.body.moldes_arvore.length; i++) {
          await MoldeArvore.create({
            ...req.body.moldes_arvore[i],
            ficha_id: ficha.id,
            ordem: i + 1
          });
        }
      }

      // Registrar movimentação inicial
      await Movimentacao.create({
        ficha_id: ficha.id,
        usuario_id: req.usuarioId,
        etapa_origem: 'criacao',
        etapa_destino: 'criacao',
        observacoes: 'Ficha criada'
      });

      const fichaCompleta = await Ficha.findByPk(ficha.id, {
        include: [
          { model: CaixaMacho, as: 'caixas_macho' },
          { model: MoldeArvore, as: 'moldes_arvore' },
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
        ]
      });

      return res.status(201).json(fichaCompleta);
    } catch (error) {
      console.error('Erro ao criar ficha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const ficha = await Ficha.findByPk(id);

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      // Atualizar campos da ficha (exceto etapa e campos calculados)
      const { caixas_macho, moldes_arvore, etapa_atual, codigo, ...dadosAtualizaveis } = req.body;

      // Recalcular campos automáticos se necessário
      const pesoMoldeAreia = dadosAtualizaveis.peso_molde_areia || ficha.peso_molde_areia;
      const pesoPeca = dadosAtualizaveis.peso_peca || ficha.peso_peca;
      const pesoArvore = dadosAtualizaveis.peso_arvore || ficha.peso_arvore;

      if (pesoMoldeAreia && pesoPeca) {
        dadosAtualizaveis.ram = parseFloat(pesoMoldeAreia) / parseFloat(pesoPeca);
      }
      if (pesoPeca && pesoArvore) {
        dadosAtualizaveis.rm = (parseFloat(pesoPeca) / parseFloat(pesoArvore)) * 100;
      }

      await ficha.update(dadosAtualizaveis);

      // Atualizar caixas de macho
      if (caixas_macho && Array.isArray(caixas_macho)) {
        // Remover caixas existentes
        await CaixaMacho.destroy({ where: { ficha_id: id } });
        
        // Criar novas caixas
        for (let i = 0; i < caixas_macho.length; i++) {
          await CaixaMacho.create({
            ...caixas_macho[i],
            ficha_id: id,
            ordem: i + 1
          });
        }
      }

      // Atualizar moldes de árvore
      if (moldes_arvore && Array.isArray(moldes_arvore)) {
        // Remover moldes existentes
        await MoldeArvore.destroy({ where: { ficha_id: id } });
        
        // Criar novos moldes
        for (let i = 0; i < moldes_arvore.length; i++) {
          await MoldeArvore.create({
            ...moldes_arvore[i],
            ficha_id: id,
            ordem: i + 1
          });
        }
      }

      const fichaAtualizada = await Ficha.findByPk(id, {
        include: [
          { model: CaixaMacho, as: 'caixas_macho' },
          { model: MoldeArvore, as: 'moldes_arvore' },
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
        ]
      });

      return res.json(fichaAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar ficha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async moverEtapa(req, res) {
    try {
      const { id } = req.params;
      const { etapa_destino, observacoes, dados_reais } = req.body;

      const ficha = await Ficha.findByPk(id);

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      const etapaOrigem = ficha.etapa_atual;
      
      // Validar se a movimentação é válida
      const proximaEtapaEsperada = getProximaEtapa(etapaOrigem, ficha.possui_usinagem);
      
      // Administrador pode mover para qualquer etapa
      if (req.usuario.grupo !== 'administrador') {
        if (etapa_destino !== proximaEtapaEsperada) {
          return res.status(400).json({ 
            error: `Movimentação inválida. A próxima etapa esperada é: ${ETAPAS[proximaEtapaEsperada]?.nome || proximaEtapaEsperada}` 
          });
        }
      }

      // Atualizar dados reais se fornecidos
      const atualizacoes = { etapa_atual: etapa_destino };
      
      if (dados_reais) {
        const campoReal = `dados_reais_${etapaOrigem}`;
        if (ficha[campoReal] !== undefined) {
          atualizacoes[campoReal] = dados_reais;
        }
      }

      await ficha.update(atualizacoes);

      // Registrar movimentação
      await Movimentacao.create({
        ficha_id: id,
        usuario_id: req.usuarioId,
        etapa_origem: etapaOrigem,
        etapa_destino,
        observacoes
      });

      // Criar notificações para usuários do próximo setor
      if (etapa_destino !== 'aprovado') {
        await NotificacaoService.criarNotificacaoMovimentacao(
          ficha.id,
          ficha.codigo,
          etapa_destino
        );
      }

      const fichaAtualizada = await Ficha.findByPk(id, {
        include: [
          { model: CaixaMacho, as: 'caixas_macho' },
          { model: MoldeArvore, as: 'moldes_arvore' },
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] },
          { 
            model: Movimentacao, 
            as: 'movimentacoes',
            include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
            order: [['data_movimentacao', 'DESC']]
          }
        ]
      });

      return res.json(fichaAtualizada);
    } catch (error) {
      console.error('Erro ao mover ficha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const ficha = await Ficha.findByPk(id);

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      // Deletar em cascata (as associações já estão configuradas)
      await ficha.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir ficha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atualizarDadosReais(req, res) {
    try {
      const { id } = req.params;
      const { etapa, dados } = req.body;

      const ficha = await Ficha.findByPk(id);

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      const campoReal = `dados_reais_${etapa}`;
      
      if (ficha[campoReal] === undefined) {
        return res.status(400).json({ error: 'Etapa inválida para dados reais' });
      }

      await ficha.update({ [campoReal]: dados });

      return res.json(ficha);
    } catch (error) {
      console.error('Erro ao atualizar dados reais:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async atrasadas(req, res) {
    try {
      // Atualizar status de atraso
      await Ficha.update(
        { atrasada: true },
        { 
          where: { 
            prazo_final: { [Op.lt]: new Date() },
            etapa_atual: { [Op.ne]: 'aprovado' },
            atrasada: false
          } 
        }
      );

      const fichas = await Ficha.findAll({
        where: { 
          atrasada: true,
          etapa_atual: { [Op.ne]: 'aprovado' }
        },
        include: [
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
        ],
        order: [['prazo_final', 'ASC']]
      });

      return res.json(fichas);
    } catch (error) {
      console.error('Erro ao listar fichas atrasadas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  getEtapas(req, res) {
    return res.json(ETAPAS);
  }
}

module.exports = new FichaController();
