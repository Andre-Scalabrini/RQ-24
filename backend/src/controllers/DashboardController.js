const { Op, fn, col, literal } = require('sequelize');
const { 
  Ficha, 
  Usuario, 
  Movimentacao,
  Reprovacao,
  sequelize 
} = require('../models');

// Default locale for date formatting (Brazilian Portuguese)
const DEFAULT_LOCALE = 'pt-BR';

// Mapeamento de etapas (10 etapas conforme RQ-24 Rev. 06)
const ETAPAS = {
  criacao: { ordem: 1, nome: 'Criação da Ficha' },
  modelacao: { ordem: 2, nome: 'Modelação' },
  moldagem: { ordem: 3, nome: 'Moldagem' },
  fusao: { ordem: 4, nome: 'Fusão' },
  acabamento: { ordem: 5, nome: 'Acabamento' },
  analise_critica: { ordem: 6, nome: 'Análise Crítica' },
  inspecao: { ordem: 7, nome: 'Inspeção' },
  dimensional: { ordem: 8, nome: 'Dimensional' },
  usinagem: { ordem: 9, nome: 'Usinagem' },
  aprovado: { ordem: 10, nome: 'Aprovado' }
};

class DashboardController {
  async resumo(req, res) {
    try {
      const { periodo, setor, projetista, material } = req.query;
      
      // Build date filter based on period
      let dateFilter = {};
      const now = new Date();
      
      if (periodo === 'hoje') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { createdAt: { [Op.gte]: startOfDay } };
      } else if (periodo === '7dias') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { [Op.gte]: sevenDaysAgo } };
      } else if (periodo === '30dias') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { createdAt: { [Op.gte]: thirtyDaysAgo } };
      }

      // Build where clause
      const where = { ...dateFilter };
      if (projetista) where.projetista = projetista;
      if (material) where.material = material;

      // Get counts
      const [totalFichas, aprovadas, reprovadasFinal, atrasadas] = await Promise.all([
        Ficha.count({ where }),
        Ficha.count({ where: { ...where, status: 'aprovada' } }),
        Ficha.count({ where: { ...where, status: 'reprovada_final' } }),
        Ficha.count({ 
          where: { 
            ...where, 
            atrasada: true, 
            status: 'em_andamento' 
          } 
        })
      ]);

      // Calculate rates
      const taxaAprovacao = totalFichas > 0 ? ((aprovadas / totalFichas) * 100).toFixed(1) : 0;
      const taxaReprovacao = totalFichas > 0 ? ((reprovadasFinal / totalFichas) * 100).toFixed(1) : 0;

      // Calculate average approval time (for approved fichas)
      const fichasAprovadas = await Ficha.findAll({
        where: { 
          ...where, 
          status: 'aprovada',
          data_aprovacao: { [Op.ne]: null }
        },
        attributes: ['createdAt', 'data_aprovacao']
      });

      let tempoMedioAprovacao = 0;
      if (fichasAprovadas.length > 0) {
        const totalDias = fichasAprovadas.reduce((sum, ficha) => {
          const diffTime = new Date(ficha.data_aprovacao) - new Date(ficha.createdAt);
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return sum + diffDays;
        }, 0);
        tempoMedioAprovacao = (totalDias / fichasAprovadas.length).toFixed(1);
      }

      return res.json({
        totalFichas,
        aprovadas,
        reprovadas: reprovadasFinal,
        atrasadas,
        taxaAprovacao: parseFloat(taxaAprovacao),
        taxaReprovacao: parseFloat(taxaReprovacao),
        tempoMedioAprovacao: parseFloat(tempoMedioAprovacao)
      });
    } catch (error) {
      console.error('Erro ao carregar resumo do dashboard:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async graficoEtapas(req, res) {
    try {
      // Get ficha count by stage (only em_andamento)
      const fichasPorEtapa = await Ficha.findAll({
        where: { status: 'em_andamento' },
        attributes: [
          'etapa_atual',
          [fn('COUNT', col('id')), 'quantidade']
        ],
        group: ['etapa_atual']
      });

      // Format response with all stages
      const resultado = Object.keys(ETAPAS).map(etapa => {
        const found = fichasPorEtapa.find(f => f.etapa_atual === etapa);
        return {
          etapa,
          nome: ETAPAS[etapa].nome,
          quantidade: found ? parseInt(found.get('quantidade'), 10) : 0
        };
      });

      return res.json(resultado);
    } catch (error) {
      console.error('Erro ao carregar gráfico de etapas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async graficoMensal(req, res) {
    try {
      const { ano } = req.query;
      const anoAtual = ano ? parseInt(ano, 10) : new Date().getFullYear();

      // Get monthly data for created, approved, and rejected
      const meses = [];
      
      for (let mes = 1; mes <= 12; mes++) {
        const inicioMes = new Date(anoAtual, mes - 1, 1);
        const fimMes = new Date(anoAtual, mes, 0, 23, 59, 59);

        const [criadas, aprovadas, reprovadas] = await Promise.all([
          Ficha.count({
            where: {
              createdAt: { [Op.between]: [inicioMes, fimMes] }
            }
          }),
          Ficha.count({
            where: {
              data_aprovacao: { [Op.between]: [inicioMes, fimMes] },
              status: 'aprovada'
            }
          }),
          Reprovacao.count({
            where: {
              data_reprovacao: { [Op.between]: [inicioMes, fimMes] }
            }
          })
        ]);

        meses.push({
          mes,
          nome: new Date(anoAtual, mes - 1).toLocaleString(DEFAULT_LOCALE, { month: 'short' }),
          criadas,
          aprovadas,
          reprovadas
        });
      }

      return res.json(meses);
    } catch (error) {
      console.error('Erro ao carregar gráfico mensal:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async fichasAtrasadas(req, res) {
    try {
      // Update delay status first
      await Ficha.update(
        { atrasada: true },
        { 
          where: { 
            prazo_final: { [Op.lt]: new Date() },
            status: 'em_andamento',
            atrasada: false
          } 
        }
      );

      const fichas = await Ficha.findAll({
        where: { 
          atrasada: true,
          status: 'em_andamento'
        },
        include: [
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
        ],
        order: [['prazo_final', 'ASC']],
        limit: 20
      });

      // Calculate days overdue
      const resultado = fichas.map(ficha => {
        const diasAtraso = Math.ceil(
          (new Date() - new Date(ficha.prazo_final)) / (1000 * 60 * 60 * 24)
        );
        return {
          ...ficha.toJSON(),
          diasAtraso
        };
      });

      return res.json(resultado);
    } catch (error) {
      console.error('Erro ao listar fichas atrasadas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async fichasRecentes(req, res) {
    try {
      const { limite } = req.query;
      const limit = limite ? parseInt(limite, 10) : 10;

      const movimentacoes = await Movimentacao.findAll({
        include: [
          { 
            model: Ficha, 
            as: 'ficha',
            include: [
              { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
            ]
          },
          { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }
        ],
        order: [['data_movimentacao', 'DESC']],
        limit
      });

      const resultado = movimentacoes.map(mov => ({
        id: mov.id,
        ficha: {
          id: mov.ficha?.id,
          codigo: mov.ficha?.codigo,
          projetista: mov.ficha?.projetista,
          material: mov.ficha?.material,
          prazo_final: mov.ficha?.prazo_final,
          atrasada: mov.ficha?.atrasada,
          status: mov.ficha?.status
        },
        etapa_atual: mov.etapa_destino,
        etapa_nome: ETAPAS[mov.etapa_destino]?.nome || mov.etapa_destino,
        usuario: mov.usuario?.nome,
        data_movimentacao: mov.data_movimentacao
      }));

      return res.json(resultado);
    } catch (error) {
      console.error('Erro ao listar fichas recentes:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async fichasProximasPrazo(req, res) {
    try {
      const diasLimite = 3;
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + diasLimite);

      const fichas = await Ficha.findAll({
        where: {
          prazo_final: { 
            [Op.between]: [new Date(), dataLimite] 
          },
          status: 'em_andamento',
          atrasada: false
        },
        include: [
          { model: Usuario, as: 'criador', attributes: ['id', 'nome'] }
        ],
        order: [['prazo_final', 'ASC']]
      });

      // Calculate remaining days
      const resultado = fichas.map(ficha => {
        const diasRestantes = Math.ceil(
          (new Date(ficha.prazo_final) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...ficha.toJSON(),
          diasRestantes
        };
      });

      return res.json(resultado);
    } catch (error) {
      console.error('Erro ao listar fichas próximas do prazo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new DashboardController();
