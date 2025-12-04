const { Op } = require('sequelize');
const { 
  Ficha, 
  CaixaMacho, 
  MoldeArvore, 
  Movimentacao, 
  Usuario, 
  Imagem,
  Notificacao,
  Setor,
  Reprovacao,
  ImagemReprovacao 
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

// Motivos de reprovação pré-definidos
const MOTIVOS_REPROVACAO = [
  'Defeito dimensional',
  'Defeito superficial',
  'Porosidade',
  'Trinca',
  'Material incorreto',
  'Inclusão de areia',
  'Rechupe',
  'Falha de preenchimento',
  'Outro'
];

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
      
      // If moving to approved, set approval date and status
      if (etapa_destino === 'aprovado') {
        atualizacoes.status = 'aprovada';
        atualizacoes.data_aprovacao = new Date();
      }
      
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

  getMotivosReprovacao(req, res) {
    return res.json(MOTIVOS_REPROVACAO);
  }

  async reprovar(req, res) {
    try {
      const { id } = req.params;
      const { motivo, descricao, etapa_retorno, imagens } = req.body;

      const ficha = await Ficha.findByPk(id);

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      if (ficha.status !== 'em_andamento') {
        return res.status(400).json({ error: 'Não é possível reprovar uma ficha que não está em andamento' });
      }

      const etapaAtual = ficha.etapa_atual;
      const etapas = Object.keys(ETAPAS);
      const indexAtual = etapas.indexOf(etapaAtual);
      const indexRetorno = etapas.indexOf(etapa_retorno);

      // Validate that etapa_retorno is before current stage
      if (indexRetorno >= indexAtual) {
        return res.status(400).json({ 
          error: 'A etapa de retorno deve ser anterior à etapa atual' 
        });
      }

      // Create rejection record
      const reprovacao = await Reprovacao.create({
        ficha_id: id,
        etapa_reprovacao: etapaAtual,
        etapa_retorno,
        motivo,
        descricao,
        usuario_id: req.usuarioId
      });

      // Save rejection images if provided
      if (imagens && Array.isArray(imagens)) {
        for (const caminho of imagens) {
          await ImagemReprovacao.create({
            reprovacao_id: reprovacao.id,
            caminho_imagem: caminho
          });
        }
      }

      // Update ficha
      await ficha.update({
        etapa_atual: etapa_retorno,
        quantidade_reprovacoes: ficha.quantidade_reprovacoes + 1
      });

      // Register movement
      await Movimentacao.create({
        ficha_id: id,
        usuario_id: req.usuarioId,
        etapa_origem: etapaAtual,
        etapa_destino: etapa_retorno,
        observacoes: `Reprovada: ${motivo} - ${descricao}`
      });

      // Create notification for the return stage sector
      await NotificacaoService.criarNotificacaoMovimentacao(
        ficha.id,
        ficha.codigo,
        etapa_retorno
      );

      const fichaAtualizada = await Ficha.findByPk(id, {
        include: [
          { model: CaixaMacho, as: 'caixas_macho' },
          { model: MoldeArvore, as: 'moldes_arvore' },
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] },
          { 
            model: Reprovacao, 
            as: 'reprovacoes',
            include: [
              { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
              { model: ImagemReprovacao, as: 'imagens' }
            ],
            order: [['data_reprovacao', 'DESC']]
          }
        ]
      });

      return res.json(fichaAtualizada);
    } catch (error) {
      console.error('Erro ao reprovar ficha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getReprovacoes(req, res) {
    try {
      const { id } = req.params;

      const reprovacoes = await Reprovacao.findAll({
        where: { ficha_id: id },
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
          { model: ImagemReprovacao, as: 'imagens' }
        ],
        order: [['data_reprovacao', 'DESC']]
      });

      return res.json(reprovacoes);
    } catch (error) {
      console.error('Erro ao listar reprovações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async aprovadasList(req, res) {
    try {
      const { periodo, projetista, material, page, limit } = req.query;
      
      const where = { status: 'aprovada' };
      
      // Date filter
      if (periodo) {
        const now = new Date();
        if (periodo === '7dias') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          where.data_aprovacao = { [Op.gte]: sevenDaysAgo };
        } else if (periodo === '30dias') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          where.data_aprovacao = { [Op.gte]: thirtyDaysAgo };
        }
      }

      if (projetista) where.projetista = projetista;
      if (material) where.material = material;

      const options = {
        where,
        include: [
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
        ],
        order: [['data_aprovacao', 'DESC']]
      };

      // Pagination
      if (page && limit) {
        options.limit = parseInt(limit, 10);
        options.offset = (parseInt(page, 10) - 1) * options.limit;
      }

      const fichas = await Ficha.findAndCountAll(options);

      // Calculate tempo de aprovacao for each ficha
      const resultado = fichas.rows.map(ficha => {
        const tempoAprovacao = ficha.data_aprovacao && ficha.createdAt
          ? Math.ceil((new Date(ficha.data_aprovacao) - new Date(ficha.createdAt)) / (1000 * 60 * 60 * 24))
          : null;
        return {
          ...ficha.toJSON(),
          tempo_aprovacao_dias: tempoAprovacao
        };
      });

      return res.json({
        fichas: resultado,
        total: fichas.count,
        page: page ? parseInt(page, 10) : 1,
        totalPages: limit ? Math.ceil(fichas.count / parseInt(limit, 10)) : 1
      });
    } catch (error) {
      console.error('Erro ao listar fichas aprovadas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async reprovadasList(req, res) {
    try {
      const { periodo, motivo, etapa, status, page, limit } = req.query;
      
      // Get fichas with rejections or reprovada_final status
      const fichaWhere = {};
      
      if (status === 'reprovada_final') {
        fichaWhere.status = 'reprovada_final';
      } else if (status === 'em_retrabalho') {
        fichaWhere.status = 'em_andamento';
        fichaWhere.quantidade_reprovacoes = { [Op.gt]: 0 };
      } else {
        // Show all with rejections
        fichaWhere[Op.or] = [
          { status: 'reprovada_final' },
          { 
            status: 'em_andamento',
            quantidade_reprovacoes: { [Op.gt]: 0 }
          }
        ];
      }

      if (etapa) {
        fichaWhere.etapa_atual = etapa;
      }

      const options = {
        where: fichaWhere,
        include: [
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] },
          { 
            model: Reprovacao, 
            as: 'reprovacoes',
            include: [
              { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }
            ],
            order: [['data_reprovacao', 'DESC']]
          }
        ],
        order: [['updatedAt', 'DESC']]
      };

      // Pagination
      if (page && limit) {
        options.limit = parseInt(limit, 10);
        options.offset = (parseInt(page, 10) - 1) * options.limit;
      }

      const fichas = await Ficha.findAndCountAll(options);

      // Filter by motivo if specified (needs to be done after fetch due to nested filter)
      let resultado = fichas.rows;
      if (motivo) {
        resultado = resultado.filter(ficha => 
          ficha.reprovacoes?.some(r => r.motivo === motivo)
        );
      }

      // Map to include last rejection info
      resultado = resultado.map(ficha => {
        const ultimaReprovacao = ficha.reprovacoes?.[0];
        return {
          ...ficha.toJSON(),
          ultimo_motivo: ultimaReprovacao?.motivo || null,
          ultima_reprovacao: ultimaReprovacao?.data_reprovacao || null
        };
      });

      return res.json({
        fichas: resultado,
        total: fichas.count,
        page: page ? parseInt(page, 10) : 1,
        totalPages: limit ? Math.ceil(fichas.count / parseInt(limit, 10)) : 1
      });
    } catch (error) {
      console.error('Erro ao listar fichas reprovadas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async reprovarFinal(req, res) {
    try {
      const { id } = req.params;
      const { observacoes } = req.body;

      const ficha = await Ficha.findByPk(id);

      if (!ficha) {
        return res.status(404).json({ error: 'Ficha não encontrada' });
      }

      if (ficha.status === 'aprovada') {
        return res.status(400).json({ error: 'Não é possível reprovar uma ficha já aprovada' });
      }

      await ficha.update({ status: 'reprovada_final' });

      // Register movement
      await Movimentacao.create({
        ficha_id: id,
        usuario_id: req.usuarioId,
        etapa_origem: ficha.etapa_atual,
        etapa_destino: 'reprovada_final',
        observacoes: observacoes || 'Ficha marcada como reprovada final'
      });

      return res.json(ficha);
    } catch (error) {
      console.error('Erro ao marcar ficha como reprovada final:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new FichaController();
