const { Router } = require('express');
const { body } = require('express-validator');
const SetorController = require('../controllers/SetorController');
const auth = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/authorization');
const validate = require('../middlewares/validate');

const router = Router();

router.use(auth);

router.get('/', SetorController.index);
router.get('/:id', SetorController.show);

router.post('/', [
  isAdmin,
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('ordem').isInt({ min: 1 }).withMessage('Ordem deve ser um número inteiro positivo'),
  validate
], SetorController.store);

router.put('/:id', [
  isAdmin,
  validate
], SetorController.update);

router.delete('/:id', isAdmin, SetorController.destroy);

module.exports = router;
