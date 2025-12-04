const jwt = require('jsonwebtoken');
const { Usuario, Setor } = require('../models');
const authConfig = require('../config/auth');

class AuthController {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      const usuario = await Usuario.findOne({
        where: { email },
        include: [{ model: Setor, as: 'setor' }]
      });

      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (!usuario.ativo) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      const senhaValida = await usuario.verificarSenha(senha);

      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { 
          id: usuario.id,
          email: usuario.email,
          grupo: usuario.grupo
        },
        authConfig.secret,
        { expiresIn: authConfig.expiresIn }
      );

      return res.json({
        usuario: usuario.toJSON(),
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async me(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.usuarioId, {
        include: [{ model: Setor, as: 'setor' }]
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(usuario.toJSON());
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async alterarSenha(req, res) {
    try {
      const { senhaAtual, novaSenha } = req.body;

      const usuario = await Usuario.findByPk(req.usuarioId);

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const senhaValida = await usuario.verificarSenha(senhaAtual);

      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      usuario.senha = novaSenha;
      await usuario.save();

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new AuthController();
