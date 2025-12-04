const sequelize = require('../config/database');
const Setor = require('./Setor');
const Usuario = require('./Usuario');
const Ficha = require('./Ficha');
const CaixaMacho = require('./CaixaMacho');
const MoldeArvore = require('./MoldeArvore');
const Movimentacao = require('./Movimentacao');
const Imagem = require('./Imagem');
const Notificacao = require('./Notificacao');
const Reprovacao = require('./Reprovacao');
const ImagemReprovacao = require('./ImagemReprovacao');

// Associations

// Usuario - Setor
Setor.hasMany(Usuario, { foreignKey: 'setor_id', as: 'usuarios' });
Usuario.belongsTo(Setor, { foreignKey: 'setor_id', as: 'setor' });

// Ficha - Usuario (criador)
Usuario.hasMany(Ficha, { foreignKey: 'criado_por', as: 'fichas_criadas' });
Ficha.belongsTo(Usuario, { foreignKey: 'criado_por', as: 'criador' });

// Ficha - CaixaMacho
Ficha.hasMany(CaixaMacho, { foreignKey: 'ficha_id', as: 'caixas_macho', onDelete: 'CASCADE' });
CaixaMacho.belongsTo(Ficha, { foreignKey: 'ficha_id', as: 'ficha' });

// Ficha - MoldeArvore
Ficha.hasMany(MoldeArvore, { foreignKey: 'ficha_id', as: 'moldes_arvore', onDelete: 'CASCADE' });
MoldeArvore.belongsTo(Ficha, { foreignKey: 'ficha_id', as: 'ficha' });

// MoldeArvore - Usuario (validador)
Usuario.hasMany(MoldeArvore, { foreignKey: 'validado_por', as: 'moldes_validados' });
MoldeArvore.belongsTo(Usuario, { foreignKey: 'validado_por', as: 'validador' });

// Ficha - Movimentacao
Ficha.hasMany(Movimentacao, { foreignKey: 'ficha_id', as: 'movimentacoes', onDelete: 'CASCADE' });
Movimentacao.belongsTo(Ficha, { foreignKey: 'ficha_id', as: 'ficha' });

// Usuario - Movimentacao
Usuario.hasMany(Movimentacao, { foreignKey: 'usuario_id', as: 'movimentacoes' });
Movimentacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Ficha - Imagem
Ficha.hasMany(Imagem, { foreignKey: 'ficha_id', as: 'imagens', onDelete: 'CASCADE' });
Imagem.belongsTo(Ficha, { foreignKey: 'ficha_id', as: 'ficha' });

// Usuario - Imagem
Usuario.hasMany(Imagem, { foreignKey: 'usuario_id', as: 'imagens_enviadas' });
Imagem.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Usuario - Notificacao
Usuario.hasMany(Notificacao, { foreignKey: 'usuario_id', as: 'notificacoes' });
Notificacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Ficha - Notificacao
Ficha.hasMany(Notificacao, { foreignKey: 'ficha_id', as: 'notificacoes' });
Notificacao.belongsTo(Ficha, { foreignKey: 'ficha_id', as: 'ficha' });

// Ficha - Reprovacao
Ficha.hasMany(Reprovacao, { foreignKey: 'ficha_id', as: 'reprovacoes', onDelete: 'CASCADE' });
Reprovacao.belongsTo(Ficha, { foreignKey: 'ficha_id', as: 'ficha' });

// Usuario - Reprovacao
Usuario.hasMany(Reprovacao, { foreignKey: 'usuario_id', as: 'reprovacoes_realizadas' });
Reprovacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Reprovacao - ImagemReprovacao
Reprovacao.hasMany(ImagemReprovacao, { foreignKey: 'reprovacao_id', as: 'imagens', onDelete: 'CASCADE' });
ImagemReprovacao.belongsTo(Reprovacao, { foreignKey: 'reprovacao_id', as: 'reprovacao' });

module.exports = {
  sequelize,
  Setor,
  Usuario,
  Ficha,
  CaixaMacho,
  MoldeArvore,
  Movimentacao,
  Imagem,
  Notificacao,
  Reprovacao,
  ImagemReprovacao
};
