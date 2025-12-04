const { Op } = require('sequelize');
const { Notificacao, Usuario, Ficha } = require('../models');

class NotificacaoController {
  async index(req, res) {
    try {
      const { lida } = req.query;
      
      const where = { usuario_id: req.usuarioId };
      
      if (lida !== undefined) {
        where.lida = lida === 'true';
      }

      const notificacoes = await Notificacao.findAll({
        where,
        include: [
          { model: Ficha, as: 'ficha', attributes: ['id', 'codigo', 'etapa_atual'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
      });

      return res.json(notificacoes);
    } catch (error) {
      console.error('Erro ao listar notificações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async naoLidas(req, res) {
    try {
      const count = await Notificacao.count({
        where: { 
          usuario_id: req.usuarioId,
          lida: false
        }
      });

      return res.json({ count });
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async marcarLida(req, res) {
    try {
      const { id } = req.params;

      const notificacao = await Notificacao.findOne({
        where: { 
          id,
          usuario_id: req.usuarioId
        }
      });

      if (!notificacao) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }

      await notificacao.update({
        lida: true,
        data_leitura: new Date()
      });

      return res.json(notificacao);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async marcarTodasLidas(req, res) {
    try {
      await Notificacao.update(
        {
          lida: true,
          data_leitura: new Date()
        },
        {
          where: {
            usuario_id: req.usuarioId,
            lida: false
          }
        }
      );

      return res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const notificacao = await Notificacao.findOne({
        where: { 
          id,
          usuario_id: req.usuarioId
        }
      });

      if (!notificacao) {
        return res.status(404).json({ error: 'Notificação não encontrada' });
      }

      await notificacao.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new NotificacaoController();
