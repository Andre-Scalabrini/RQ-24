const { Router } = require('express');
const { body } = require('express-validator');
const FichaController = require('../controllers/FichaController');
const auth = require('../middlewares/auth');
const { isAdmin, canMoveFicha } = require('../middlewares/authorization');
const validate = require('../middlewares/validate');

const router = Router();

router.use(auth);

// Rotas de listagem
router.get('/', FichaController.index);
router.get('/kanban', FichaController.kanban);
router.get('/atrasadas', FichaController.atrasadas);
router.get('/etapas', FichaController.getEtapas);
router.get('/:id', FichaController.show);

// Criar ficha
router.post('/', [
  body('projetista').notEmpty().withMessage('Projetista é obrigatório'),
  body('quantidade_amostra').isInt({ min: 1 }).withMessage('Quantidade de amostra deve ser um número positivo'),
  body('material').notEmpty().withMessage('Material é obrigatório'),
  body('peso_peca').isFloat({ min: 0.001 }).withMessage('Peso da peça deve ser um número positivo'),
  body('numero_pecas_molde').isInt({ min: 1 }).withMessage('Número de peças por molde deve ser um número positivo'),
  body('processo_moldagem').isIn(['PEPSET', 'COLDBOX', 'MOLDMATIC', 'JOB']).withMessage('Processo de moldagem inválido'),
  body('prazo_final').isISO8601().withMessage('Prazo final deve ser uma data válida'),
  body('peso_molde_areia').isFloat({ min: 0.001 }).withMessage('Peso do molde de areia deve ser um número positivo'),
  body('peso_arvore').isFloat({ min: 0.001 }).withMessage('Peso da árvore deve ser um número positivo'),
  body('quantidade_figuras_ferramenta').isInt({ min: 1 }).withMessage('Quantidade de figuras deve ser um número positivo'),
  body('material_ferramenta').notEmpty().withMessage('Material da ferramenta é obrigatório'),
  body('posicao_vazamento').notEmpty().withMessage('Posição de vazamento é obrigatória'),
  validate
], FichaController.store);

// Atualizar ficha
router.put('/:id', [
  validate
], FichaController.update);

// Mover etapa
router.post('/:id/mover', [
  canMoveFicha,
  body('etapa_destino').notEmpty().withMessage('Etapa de destino é obrigatória'),
  validate
], FichaController.moverEtapa);

// Atualizar dados reais
router.put('/:id/dados-reais', [
  body('etapa').notEmpty().withMessage('Etapa é obrigatória'),
  body('dados').isObject().withMessage('Dados devem ser um objeto'),
  validate
], FichaController.atualizarDadosReais);

// Excluir ficha
router.delete('/:id', isAdmin, FichaController.destroy);

module.exports = router;
