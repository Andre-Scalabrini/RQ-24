const { Notificacao, Usuario, Setor } = require('../models');

// Mapeamento de etapas para setores
const ETAPA_SETOR = {
  modelacao: 'Modelação',
  moldagem: 'Moldagem',
  fusao: 'Fusão',
  rebarbacao: 'Rebarbação',
  inspecao: 'Inspeção',
  usinagem: 'Usinagem'
};

class NotificacaoService {
  async criarNotificacaoMovimentacao(fichaId, codigoFicha, etapaDestino) {
    try {
      const setorNome = ETAPA_SETOR[etapaDestino];
      
      if (!setorNome) {
        return; // Não há setor correspondente para esta etapa
      }

      // Buscar setor
      const setor = await Setor.findOne({ where: { nome: setorNome } });
      
      if (!setor) {
        return;
      }

      // Buscar usuários do setor
      const usuarios = await Usuario.findAll({
        where: { 
          setor_id: setor.id,
          ativo: true
        }
      });

      // Criar notificação para cada usuário
      for (const usuario of usuarios) {
        await Notificacao.create({
          usuario_id: usuario.id,
          ficha_id: fichaId,
          tipo: 'movimentacao',
          titulo: 'Nova ficha disponível',
          mensagem: `A ficha ${codigoFicha} foi movida para o setor de ${setorNome}`
        });
      }
    } catch (error) {
      console.error('Erro ao criar notificação de movimentação:', error);
    }
  }

  async criarNotificacaoAtraso(fichaId, codigoFicha, etapaAtual) {
    try {
      // Buscar todos os setores que ainda precisam processar a ficha
      const setoresRestantes = [];
      const etapas = Object.keys(ETAPA_SETOR);
      const indexAtual = etapas.indexOf(etapaAtual);

      for (let i = indexAtual; i < etapas.length; i++) {
        const setorNome = ETAPA_SETOR[etapas[i]];
        if (setorNome) {
          setoresRestantes.push(setorNome);
        }
      }

      // Buscar setores
      const setores = await Setor.findAll({
        where: { nome: setoresRestantes }
      });

      // Buscar usuários dos setores
      for (const setor of setores) {
        const usuarios = await Usuario.findAll({
          where: { 
            setor_id: setor.id,
            ativo: true
          }
        });

        for (const usuario of usuarios) {
          await Notificacao.create({
            usuario_id: usuario.id,
            ficha_id: fichaId,
            tipo: 'atraso',
            titulo: 'Ficha atrasada',
            mensagem: `A ficha ${codigoFicha} está atrasada e ainda precisa passar pelo setor de ${setor.nome}`
          });
        }
      }

      // Notificar administradores
      const admins = await Usuario.findAll({
        where: { 
          grupo: 'administrador',
          ativo: true
        }
      });

      for (const admin of admins) {
        await Notificacao.create({
          usuario_id: admin.id,
          ficha_id: fichaId,
          tipo: 'atraso',
          titulo: 'Ficha atrasada',
          mensagem: `A ficha ${codigoFicha} está atrasada. Etapa atual: ${etapaAtual}`
        });
      }
    } catch (error) {
      console.error('Erro ao criar notificação de atraso:', error);
    }
  }

  async criarNotificacaoAprovacao(fichaId, codigoFicha, criadorId) {
    try {
      await Notificacao.create({
        usuario_id: criadorId,
        ficha_id: fichaId,
        tipo: 'aprovacao',
        titulo: 'Ficha aprovada',
        mensagem: `A ficha ${codigoFicha} foi aprovada com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao criar notificação de aprovação:', error);
    }
  }

  async criarNotificacaoReprovacao(fichaId, codigoFicha, criadorId, motivo, etapaReprovacao) {
    try {
      // Notify the projetista (creator) of the ficha
      await Notificacao.create({
        usuario_id: criadorId,
        ficha_id: fichaId,
        tipo: 'reprovacao',
        titulo: 'Ficha reprovada',
        mensagem: `A ficha ${codigoFicha} foi reprovada na etapa ${etapaReprovacao}. Motivo: ${motivo}`
      });

      // Notify all administrators
      const admins = await Usuario.findAll({
        where: { 
          grupo: 'administrador',
          ativo: true
        }
      });

      for (const admin of admins) {
        // Don't notify if the admin is also the creator
        if (admin.id !== criadorId) {
          await Notificacao.create({
            usuario_id: admin.id,
            ficha_id: fichaId,
            tipo: 'reprovacao',
            titulo: 'Ficha reprovada',
            mensagem: `A ficha ${codigoFicha} foi reprovada na etapa ${etapaReprovacao}. Motivo: ${motivo}`
          });
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificação de reprovação:', error);
    }
  }
}

module.exports = new NotificacaoService();
