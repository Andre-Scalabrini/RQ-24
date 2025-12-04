const { Router } = require('express');
const { body } = require('express-validator');
const UsuarioController = require('../controllers/UsuarioController');
const auth = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/authorization');
const validate = require('../middlewares/validate');

const router = Router();

router.use(auth);

router.get('/', UsuarioController.index);
router.get('/setor/:setorId', UsuarioController.bySetor);
router.get('/:id', UsuarioController.show);

router.post('/', [
  isAdmin,
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('grupo').isIn(['administrador', 'superior', 'comum']).withMessage('Grupo inválido'),
  validate
], UsuarioController.store);

router.put('/:id', [
  isAdmin,
  validate
], UsuarioController.update);

router.delete('/:id', isAdmin, UsuarioController.destroy);

module.exports = router;
