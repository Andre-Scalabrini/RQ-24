const { Setor, Usuario } = require('../models');

class SetorController {
  async index(req, res) {
    try {
      const setores = await Setor.findAll({
        where: { ativo: true },
        order: [['ordem', 'ASC']]
      });

      return res.json(setores);
    } catch (error) {
      console.error('Erro ao listar setores:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const setor = await Setor.findByPk(id, {
        include: [{ model: Usuario, as: 'usuarios' }]
      });

      if (!setor) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      return res.json(setor);
    } catch (error) {
      console.error('Erro ao buscar setor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const { nome, ordem, descricao } = req.body;

      const setorExistente = await Setor.findOne({ where: { nome } });
      if (setorExistente) {
        return res.status(400).json({ error: 'Setor já cadastrado' });
      }

      const setor = await Setor.create({
        nome,
        ordem,
        descricao
      });

      return res.status(201).json(setor);
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nome, ordem, descricao, ativo } = req.body;

      const setor = await Setor.findByPk(id);

      if (!setor) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      if (nome && nome !== setor.nome) {
        const setorExistente = await Setor.findOne({ where: { nome } });
        if (setorExistente) {
          return res.status(400).json({ error: 'Nome de setor já existe' });
        }
      }

      await setor.update({
        nome: nome || setor.nome,
        ordem: ordem !== undefined ? ordem : setor.ordem,
        descricao: descricao !== undefined ? descricao : setor.descricao,
        ativo: ativo !== undefined ? ativo : setor.ativo
      });

      return res.json(setor);
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const setor = await Setor.findByPk(id);

      if (!setor) {
        return res.status(404).json({ error: 'Setor não encontrado' });
      }

      // Verificar se há usuários vinculados
      const usuarios = await Usuario.count({ where: { setor_id: id } });
      if (usuarios > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir setor com usuários vinculados' 
        });
      }

      // Soft delete
      await setor.update({ ativo: false });

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new SetorController();
