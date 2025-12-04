const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

const router = Router();

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória'),
  validate
], AuthController.login);

router.get('/me', auth, AuthController.me);

router.put('/alterar-senha', [
  auth,
  body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
  body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres'),
  validate
], AuthController.alterarSenha);

module.exports = router;
