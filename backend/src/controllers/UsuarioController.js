const { Usuario, Setor } = require('../models');

class UsuarioController {
  async index(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        include: [{ model: Setor, as: 'setor' }],
        order: [['nome', 'ASC']]
      });

      return res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        include: [{ model: Setor, as: 'setor' }]
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async store(req, res) {
    try {
      const { nome, email, senha, grupo, setor_id } = req.body;

      const usuarioExistente = await Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const usuario = await Usuario.create({
        nome,
        email,
        senha,
        grupo,
        setor_id
      });

      const usuarioCompleto = await Usuario.findByPk(usuario.id, {
        include: [{ model: Setor, as: 'setor' }]
      });

      return res.status(201).json(usuarioCompleto);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, grupo, setor_id, ativo } = req.body;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      if (email && email !== usuario.email) {
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
          return res.status(400).json({ error: 'Email já cadastrado' });
        }
      }

      await usuario.update({
        nome: nome || usuario.nome,
        email: email || usuario.email,
        grupo: grupo || usuario.grupo,
        setor_id: setor_id !== undefined ? setor_id : usuario.setor_id,
        ativo: ativo !== undefined ? ativo : usuario.ativo
      });

      const usuarioAtualizado = await Usuario.findByPk(id, {
        include: [{ model: Setor, as: 'setor' }]
      });

      return res.json(usuarioAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Soft delete - apenas desativa o usuário
      await usuario.update({ ativo: false });

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async bySetor(req, res) {
    try {
      const { setorId } = req.params;

      const usuarios = await Usuario.findAll({
        where: { setor_id: setorId, ativo: true },
        include: [{ model: Setor, as: 'setor' }],
        order: [['nome', 'ASC']]
      });

      return res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários por setor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new UsuarioController();
