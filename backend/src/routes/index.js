const { Router } = require('express');
const authRoutes = require('./auth');
const usuariosRoutes = require('./usuarios');
const setoresRoutes = require('./setores');
const fichasRoutes = require('./fichas');
const imagensRoutes = require('./imagens');
const notificacoesRoutes = require('./notificacoes');
const pdfRoutes = require('./pdf');
const dashboardRoutes = require('./dashboard');

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/setores', setoresRoutes);
router.use('/fichas', fichasRoutes);
router.use('/imagens', imagensRoutes);
router.use('/notificacoes', notificacoesRoutes);
router.use('/pdf', pdfRoutes);
router.use('/dashboard', dashboardRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
