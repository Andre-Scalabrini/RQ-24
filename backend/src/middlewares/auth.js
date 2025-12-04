const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { Usuario, Setor } = require('../models');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }

    const decoded = jwt.verify(token, authConfig.secret);

    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: Setor, as: 'setor' }]
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    req.usuario = usuario;
    req.usuarioId = usuario.id;

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
};

module.exports = auth;
