// Middleware para verificar se o usuário é administrador
const isAdmin = (req, res, next) => {
  if (req.usuario.grupo !== 'administrador') {
    return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
  }
  return next();
};

// Middleware para verificar se o usuário pode mover fichas (administrador ou superior)
const canMoveFicha = (req, res, next) => {
  if (req.usuario.grupo !== 'administrador' && req.usuario.grupo !== 'superior') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores e usuários superiores podem mover fichas.' 
    });
  }
  return next();
};

// Middleware para verificar acesso ao setor
const checkSetorAccess = (setoresPermitidos) => {
  return (req, res, next) => {
    // Administrador tem acesso a tudo
    if (req.usuario.grupo === 'administrador') {
      return next();
    }

    // Verificar se o setor do usuário está na lista de setores permitidos
    if (req.usuario.setor && setoresPermitidos.includes(req.usuario.setor.nome.toLowerCase())) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Acesso negado. Você não tem permissão para acessar este setor.' 
    });
  };
};

// Middleware para verificar se o usuário pertence a pelo menos um dos setores especificados
const belongsToSetor = (...setores) => {
  return (req, res, next) => {
    // Administrador tem acesso a tudo
    if (req.usuario.grupo === 'administrador') {
      return next();
    }

    const setoresLower = setores.map(s => s.toLowerCase());
    
    if (req.usuario.setor && setoresLower.includes(req.usuario.setor.nome.toLowerCase())) {
      return next();
    }

    return res.status(403).json({ 
      error: `Acesso negado. Apenas usuários dos setores ${setores.join(', ')} podem acessar.` 
    });
  };
};

module.exports = {
  isAdmin,
  canMoveFicha,
  checkSetorAccess,
  belongsToSetor
};
